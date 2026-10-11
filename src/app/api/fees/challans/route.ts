import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAccessibleStudentIds } from "@/lib/fee-access";
import { calculateConcession, calculateLateFee, getFeeDueDate, getFeeMonthRange } from "@/lib/fees";
import { feeMonthSchema, isValidObjectId, FEE_CHALLAN_STATUSES } from "@/lib/validations";
import { nextCounterValue } from "@/lib/counters";
import { FeeChallan } from "@/models/FeeChallan";
import { FeeStructure } from "@/models/FeeStructure";
import { Student } from "@/models/Student";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { recordAdminAudit } from "@/lib/admin-audit";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (!["ADMIN", "STUDENT", "PARENT"].includes(user.role)) {
      return NextResponse.json({ success: false, message: "You do not have access to fee records." }, { status: 403 });
    }
    await connectDB();
    const params = request.nextUrl.searchParams;
    const periodMonth = params.get("month") || "";
    const status = params.get("status") || "";
    const programId = params.get("program") || "";
    if (periodMonth && !feeMonthSchema.safeParse(periodMonth).success) {
      return NextResponse.json({ success: false, message: "Month must use YYYY-MM format." }, { status: 400 });
    }
    if (programId && !isValidObjectId(programId)) return NextResponse.json({ success: false, message: "Invalid program filter." }, { status: 400 });
    if (status && !FEE_CHALLAN_STATUSES.includes(status as (typeof FEE_CHALLAN_STATUSES)[number])) {
      return NextResponse.json({ success: false, message: "Invalid challan status filter." }, { status: 400 });
    }

    const studentIds = await getAccessibleStudentIds(user);
    if (studentIds && studentIds.length === 0) {
      return NextResponse.json({ success: true, data: { challans: [], summary: { collected: 0, outstanding: 0, overdue: 0 } } });
    }
    const requestedStudentId = params.get("studentId");
    if (requestedStudentId) {
      if (!isValidObjectId(requestedStudentId)) return NextResponse.json({ success: false, message: "Invalid student filter." }, { status: 400 });
      if (studentIds && !studentIds.includes(requestedStudentId)) {
        return NextResponse.json({ success: false, message: "Student not found or access denied." }, { status: user.role === "STUDENT" ? 403 : 404 });
      }
    }
    const studentFilter: Record<string, unknown> = {};
    if (studentIds) studentFilter._id = { $in: studentIds };
    if (requestedStudentId) studentFilter._id = requestedStudentId;
    if (programId) studentFilter.program = programId;
    const matchingStudents = await Student.find(studentFilter).select("_id").lean();
    const query: Record<string, unknown> = { student: { $in: matchingStudents.map((student) => student._id) } };
    if (periodMonth) query.periodMonth = periodMonth;
    if (status) query.status = status;
    const challans = await FeeChallan.find(query)
      .populate({ path: "student", select: "regNo fullName fatherName classLevel program", populate: { path: "program", select: "title level" } })
      .populate({ path: "payments", select: "method amount transactionId senderNumber proofUrl proofFilename proofMimeType status note createdAt" })
      .sort({ periodMonth: -1, createdAt: -1 }).limit(500).lean();

    const month = periodMonth || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit" }).format(new Date());
    const summaryQuery: Record<string, unknown> = { student: { $in: matchingStudents.map((student) => student._id) }, periodMonth: month, status: { $ne: "Cancelled" } };
    const summaryChallans = await FeeChallan.find(summaryQuery).select("total paidAmount status").lean();
    const summary = summaryChallans.reduce((totals, challan) => {
      totals.collected += challan.paidAmount || 0;
      if (challan.status !== "Paid") totals.outstanding += Math.max(0, challan.total - (challan.paidAmount || 0));
      if (challan.status === "Overdue") totals.overdue += Math.max(0, challan.total - (challan.paidAmount || 0));
      return totals;
    }, { collected: 0, outstanding: 0, overdue: 0 });

    return NextResponse.json({ success: true, data: { challans, summary } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET /api/fees/challans failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load fee challans." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (admin.role !== "ADMIN") return NextResponse.json({ success: false, message: "Administrator access is required." }, { status: 403 });
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const periodMonth = input.periodMonth;
    const scope = input.scope;
    if (typeof periodMonth !== "string" || !feeMonthSchema.safeParse(periodMonth).success
      || !["student", "program", "all"].includes(String(scope))) {
      return NextResponse.json({ success: false, message: "Choose a valid month and generation scope." }, { status: 400 });
    }
    if (scope === "student" && !isValidObjectId(input.studentId)) return NextResponse.json({ success: false, message: "Choose a valid student." }, { status: 400 });
    if (scope === "program" && !isValidObjectId(input.programId)) return NextResponse.json({ success: false, message: "Choose a valid class or program." }, { status: 400 });

    await connectDB();
    const filter: Record<string, unknown> = { status: "active" };
    if (scope === "student") filter._id = input.studentId;
    if (scope === "program") filter.program = input.programId;
    const students = await Student.find(filter).populate("program", "title").sort({ regNo: 1 }).lean();
    const dueDate = getFeeDueDate(periodMonth);
    const range = getFeeMonthRange(periodMonth);
    const feeStructures = new Map<string, { monthlyFee: number; admissionFee: number }>();
    const results: { challanNo: string; student: string; status: "created" | "existing" }[] = [];

    for (const student of students) {
      const existing = await FeeChallan.findOne({ student: student._id, periodMonth }).select("challanNo").lean();
      if (existing) {
        results.push({ challanNo: existing.challanNo, student: String(student._id), status: "existing" });
        continue;
      }
      const programId = String(student.program?._id ?? student.program);
      let structure = feeStructures.get(programId);
      if (!structure) {
        const record = await FeeStructure.findOne({ program: programId, effectiveFrom: { $lte: range.start } }).sort({ effectiveFrom: -1 }).lean();
        if (!record) continue;
        structure = { monthlyFee: record.monthlyFee, admissionFee: record.admissionFee };
        feeStructures.set(programId, structure);
      }
      const isFirstMonth = student.admissionDate && new Date(student.admissionDate).toISOString().slice(0, 7) === periodMonth;
      const items = [{ label: `Monthly tuition - ${periodMonth}`, amount: structure.monthlyFee }];
      if (isFirstMonth && structure.admissionFee > 0) items.push({ label: "One-time admission fee", amount: structure.admissionFee });
      const subtotal = items.reduce((total, item) => total + item.amount, 0);
      const concessionPercent = Math.min(100, Math.max(0, Number(student.concession?.percent || 0)));
      const discount = calculateConcession(structure.monthlyFee, concessionPercent);
      const lateFee = calculateLateFee(dueDate);
      const sequence = await nextCounterValue(`fee-challan-${periodMonth.replace("-", "")}`);
      const challanNo = `CH-${periodMonth.replace("-", "")}-${String(sequence).padStart(5, "0")}`;
      try {
        const challan = await FeeChallan.create({
          challanNo, student: student._id, periodMonth, items, subtotal, discount, lateFee,
          total: Math.max(0, subtotal - discount + lateFee), dueDate, generatedBy: admin.id,
        });
        results.push({ challanNo: challan.challanNo, student: String(student._id), status: "created" });
        await recordAdminAudit(admin, request, "FEE_CHALLAN_CREATED", "FeeChallan", String(challan._id), {
          challanNo: challan.challanNo,
          studentId: String(student._id),
          periodMonth,
          total: challan.total,
        });
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === 11000) {
          const duplicate = await FeeChallan.findOne({ student: student._id, periodMonth }).select("challanNo").lean();
          if (duplicate) {
            results.push({ challanNo: duplicate.challanNo, student: String(student._id), status: "existing" });
            continue;
          }
        }
        throw error;
      }
    }
    await Promise.all(results.filter((item) => item.status === "created").map((item) => {
      return notify({ studentId: item.student, type: "Challan", key: `challan:${item.student}:${periodMonth}`, detail: item.challanNo });
    }));
    return NextResponse.json({ success: true, data: { results, created: results.filter((item) => item.status === "created").length, existing: results.filter((item) => item.status === "existing").length, skipped: students.length - results.length } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/fees/challans failed:", error);
    return NextResponse.json({ success: false, message: "Unable to generate challans." }, { status: 500 });
  }
}
