import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { fail, ok, requireAuth } from "@/lib/api";
import { isValidObjectId } from "@/lib/validations";
import { FeeChallan } from "@/models/FeeChallan";
import { Student } from "@/models/Student";
import { Admission } from "@/models/Admission";
import { Attendance } from "@/models/Attendance";
import { CounselingBooking } from "@/models/CounselingBooking";
import { recordAdminAudit } from "@/lib/admin-audit";
import { sendEmail } from "@/lib/email";
import { getAcademySettings } from "@/lib/academy-settings";
import { sumFeeTotals } from "@/lib/fee-totals";

function karachiDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

function parseDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00+05:00`);
  const dateInKarachi = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return Number.isNaN(date.getTime()) || dateInKarachi !== value ? null : date;
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function csvResponse(report: string, rows: Array<Record<string, unknown>>) {
  const headers = rows.length ? Object.keys(rows[0]) : ["message"];
  const content = [headers, ...(rows.length ? rows.map((row) => headers.map((header) => row[header])) : [["No data"]])]
    .map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new Response(content, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${report}.csv"`, "Cache-Control": "private, no-store" },
  });
}

function monthlyRows(challans: Array<{ periodMonth: string; paidAmount: number; pendingAmount: number; status: string }>, from: string, to: string) {
  const totals = new Map<string, { month: string; collected: number; outstanding: number; overdue: number }>();
  const cursor = new Date(`${from.slice(0, 7)}-01T12:00:00.000Z`);
  const end = new Date(`${to.slice(0, 7)}-01T12:00:00.000Z`);
  while (cursor <= end) {
    const month = cursor.toISOString().slice(0, 7);
    totals.set(month, { month, collected: 0, outstanding: 0, overdue: 0 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  for (const challan of challans) {
    const row = totals.get(challan.periodMonth);
    if (!row || challan.status === "Cancelled") continue;
    row.collected += challan.paidAmount;
    if (challan.status === "Overdue") row.overdue += challan.pendingAmount;
    else row.outstanding += challan.pendingAmount;
  }
  return Array.from(totals.values());
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const params = new URL(request.url).searchParams;
    const now = new Date();
    const today = karachiDate(now);
    const defaultFrom = `${today.slice(0, 4)}-01-01`;
    const fromValue = params.get("from") ?? defaultFrom;
    const toValue = params.get("to") ?? today;
    const fromDate = parseDate(fromValue);
    const toDate = parseDate(toValue);
    const days = Number(params.get("defaulterDays") ?? "30");
    if (!fromDate || !toDate || fromDate > toDate || !Number.isInteger(days) || days < 1 || days > 365) {
      return fail("Choose a valid report date range and defaulter threshold.", 400);
    }
    const fromMonth = fromValue.slice(0, 7);
    const toMonth = toValue.slice(0, 7);
    const startOfMonth = new Date(`${today.slice(0, 7)}-01T00:00:00+05:00`);
    const startOfYear = new Date(`${today.slice(0, 4)}-01-01T00:00:00+05:00`);
    const rangeEnd = new Date(toDate.getTime() + 24 * 60 * 60 * 1000);
    const monthEnd = new Date(startOfMonth);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
    const daysCutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    await connectDB();
    const [
      activeStudents,
      newAdmissions,
      admissionFunnel,
      monthChallans,
      yearChallans,
      rangeChallans,
      attendanceRows,
      counselingRows,
      activeStudentsWithProgram,
      defaulterDocs,
    ] = await Promise.all([
      Student.countDocuments({ status: "active" }),
      Admission.countDocuments({ submittedAt: { $gte: startOfMonth, $lt: monthEnd } }),
      Admission.aggregate([
        { $match: { submittedAt: { $gte: fromDate, $lt: rangeEnd } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      FeeChallan.find({ periodMonth: today.slice(0, 7) }).select("paidAmount pendingAmount status").lean(),
      FeeChallan.find({ periodMonth: { $gte: `${today.slice(0, 4)}-01`, $lte: today.slice(0, 7) } }).select("paidAmount pendingAmount status").lean(),
      FeeChallan.find({ periodMonth: { $gte: fromMonth, $lte: toMonth } }).select("periodMonth paidAmount pendingAmount status").sort({ periodMonth: 1 }).limit(10000).lean(),
      Attendance.aggregate([
        { $match: { date: { $gte: fromDate, $lt: rangeEnd } } },
        { $lookup: { from: "students", localField: "student", foreignField: "_id", as: "studentRecord" } },
        { $unwind: "$studentRecord" },
        { $group: { _id: "$studentRecord.classLevel", total: { $sum: 1 }, attended: { $sum: { $cond: [{ $in: ["$status", ["Present", "Late"]] }, 1, 0] } } } },
        { $sort: { _id: 1 } },
      ]),
      CounselingBooking.aggregate([
        { $match: { preferredDate: { $gte: fromDate, $lt: rangeEnd }, status: { $ne: "Cancelled" } } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Student.find({ status: "active" }).select("concession program").populate("program", "monthlyFee").lean(),
      FeeChallan.find({ status: "Overdue", dueDate: { $lte: daysCutoff } }).populate({
        path: "student",
        select: "regNo fullName phone guardian user",
        populate: [{ path: "guardian", select: "name email" }, { path: "user", select: "email" }],
      }).sort({ dueDate: 1 }).limit(500).lean(),
    ]);

    const monthFees = sumFeeTotals(monthChallans);
    const yearFees = sumFeeTotals(yearChallans);
    const rangeMonthly = monthlyRows(rangeChallans, fromValue, toValue);
    const admissionStatuses = ["Submitted", "UnderReview", "Approved", "Rejected", "Enrolled"];
    const funnel = admissionStatuses.map((status) => ({
      status,
      count: admissionFunnel.find((row: { _id: string }) => row._id === status)?.count ?? 0,
    }));
    const classAttendance = attendanceRows.map((row: { _id: string; total: number; attended: number }) => ({
      classLevel: row._id || "Unassigned",
      total: row.total,
      attended: row.attended,
      rate: row.total ? Math.round((row.attended / row.total) * 100) : 0,
    }));
    const counselingByType = counselingRows.map((row: { _id: string; count: number }) => ({ type: row._id, count: row.count }));
    const concessionKeys = ["orphan", "widow_child", "merit", "other"];
    const concessionBreakdown = concessionKeys.map((type) => {
      const students = activeStudentsWithProgram.filter((student) => student.concession?.type === type);
      const discounted = students.reduce((total, student) => {
        const program = typeof student.program === "object" && student.program ? student.program as { monthlyFee?: number } : null;
        return total + Math.round((program?.monthlyFee ?? 0) * (student.concession?.percent ?? 0) / 100);
      }, 0);
      return { type, count: students.length, monthlyDiscountedPkr: discounted };
    });
    const defaulters = defaulterDocs.map((challan) => {
      const student = typeof challan.student === "object" && challan.student ? challan.student as {
        _id: unknown; regNo: string; fullName: string; phone: string;
        guardian?: { email?: string } | null; user?: { email?: string } | null;
      } : null;
      return {
        studentId: student ? String(student._id) : "",
        regNo: student?.regNo ?? "",
        name: student?.fullName ?? "",
        phone: student?.phone ?? "",
        email: student?.guardian?.email ?? student?.user?.email ?? "",
        challanId: String(challan._id),
        challanNo: challan.challanNo,
        pendingAmount: challan.pendingAmount,
        dueDate: challan.dueDate,
      };
    });

    const data = {
      generatedAt: now.toISOString(),
      dateRange: { from: fromValue, to: toValue },
      kpis: {
        activeStudents,
        newAdmissionsThisMonth: newAdmissions,
        collectionRateMonth: monthFees.collected + monthFees.outstanding + monthFees.overdue ? Math.round(monthFees.collected / (monthFees.collected + monthFees.outstanding + monthFees.overdue) * 100) : 0,
        collectionRateYtd: yearFees.collected + yearFees.outstanding + yearFees.overdue ? Math.round(yearFees.collected / (yearFees.collected + yearFees.outstanding + yearFees.overdue) * 100) : 0,
      },
      fees: { month: monthFees, ytd: yearFees, monthly: rangeMonthly },
      admissionFunnel: funnel,
      attendanceByClass: classAttendance,
      counselingByType,
      concessions: concessionBreakdown,
      defaulters,
    };

    const report = params.get("report");
    if (report) {
      const reportRows = report === "fees" ? rangeMonthly
        : report === "admissions" ? funnel
        : report === "attendance" ? classAttendance
        : report === "counseling" ? counselingByType
        : report === "concessions" ? concessionBreakdown
        : report === "defaulters" ? defaulters
        : report === "kpis" ? [
            { metric: "activeStudents", value: activeStudents },
            { metric: "newAdmissionsThisMonth", value: newAdmissions },
            { metric: "monthCollectedPkr", value: monthFees.collected },
            { metric: "monthOutstandingPkr", value: monthFees.outstanding },
            { metric: "monthOverduePkr", value: monthFees.overdue },
            { metric: "ytdCollectedPkr", value: yearFees.collected },
            { metric: "ytdOutstandingPkr", value: yearFees.outstanding },
            { metric: "ytdOverduePkr", value: yearFees.overdue },
          ]
        : null;
      if (!reportRows) return fail("Choose a valid report to export.", 400);
      return csvResponse(report, reportRows);
    }
    return ok(data);
  } catch (error) {
    console.error("GET /api/admin/reports failed:", error);
    return fail("Unable to generate reports.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    let input: Record<string, unknown>;
    try {
      input = await request.json();
    } catch {
      return fail("Invalid request body.", 400);
    }
    if (!isValidObjectId(input.studentId)) return fail("A valid student is required.", 400);
    await connectDB();
    const student = await Student.findById(input.studentId).populate("guardian", "name email").populate("user", "email").lean();
    if (!student) return fail("Student not found.", 404);
    const guardian = typeof student.guardian === "object" && student.guardian ? student.guardian as { email?: string } : null;
    const user = typeof student.user === "object" && student.user ? student.user as { email?: string } : null;
    const recipient = guardian?.email ?? user?.email ?? "";
    if (!recipient) return fail("No student or parent email is available for this reminder.", 400);
    const challan = await FeeChallan.findOne({ student: input.studentId, status: "Overdue" }).sort({ dueDate: 1 }).lean();
    if (!challan) return fail("No overdue challan was found for this student.", 404);
    const academy = await getAcademySettings();
    await sendEmail({
      to: recipient,
      subject: `Overdue fee reminder — ${academy.name}`,
      html: "",
      text: `Hello,\n\nThis is a reminder that fee challan ${challan.challanNo} for ${student.fullName} has an outstanding balance of PKR ${challan.pendingAmount}. Its due date was ${challan.dueDate.toISOString().slice(0, 10)}.\n\nPlease contact the academy if you have already paid.`,
    });
    await recordAdminAudit(auth.user, request, "FEE_REMINDER_SENT", "Student", String(student._id), { challanId: String(challan._id), email: recipient });
    return ok({ sent: true });
  } catch (error) {
    console.error("POST /api/admin/reports fee reminder failed:", error);
    return fail("Unable to send the fee reminder.", 500);
  }
}
