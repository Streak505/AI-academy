import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAccessibleStudentIds } from "@/lib/fee-access";
import { resolvePortalStudentId } from "@/lib/portal-access";
import { getCurrentUser } from "@/lib/auth";
import { getAcademySettings } from "@/lib/academy-settings";
import { Attendance } from "@/models/Attendance";
import { Assessment } from "@/models/Assessment";
import { Assignment } from "@/models/Assignment";
import { AssignmentSubmission } from "@/models/AssignmentSubmission";
import { CounselingBooking } from "@/models/CounselingBooking";
import { FeeChallan } from "@/models/FeeChallan";
import { Notice } from "@/models/Notice";
import { Student } from "@/models/Student";
import { isValidObjectId, feeMonthSchema } from "@/lib/validations";

function currentKarachiMonth() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit" }).format(new Date());
}

function monthBounds(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1) - 5 * 60 * 60 * 1000);
  const end = new Date(Date.UTC(year, monthNumber, 1) - 5 * 60 * 60 * 1000);
  return { start, end };
}

function serializeStudent(student: { _id: unknown; fullName: string; regNo: string; program?: unknown; classLevel: string }) {
  const program = student.program && typeof student.program === "object" && "title" in student.program
    ? { id: String((student.program as { _id?: unknown })._id ?? ""), title: String((student.program as { title?: string }).title ?? "") }
    : null;
  return { id: String(student._id), fullName: student.fullName, regNo: student.regNo, classLevel: student.classLevel, program };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    const academy = await getAcademySettings();
    if (!["STUDENT", "PARENT", "ADMIN"].includes(user.role)) return NextResponse.json({ success: false, message: "You do not have access to portal records." }, { status: 403 });
    await connectDB();
    const params = request.nextUrl.searchParams;
    const requestedId = params.get("studentId");
    const view = params.get("view") || "dashboard";
    const month = params.get("month") || currentKarachiMonth();
    if (!["dashboard", "attendance", "results", "assignments", "notices", "progress", "counseling"].includes(view)) {
      return NextResponse.json({ success: false, message: "Invalid portal view." }, { status: 400 });
    }
    if (requestedId && !isValidObjectId(requestedId)) return NextResponse.json({ success: false, message: "Invalid student id." }, { status: 400 });
    if (!feeMonthSchema.safeParse(month).success) return NextResponse.json({ success: false, message: "Month must use YYYY-MM format." }, { status: 400 });

    const accessibleIds = await getAccessibleStudentIds(user);
    const availableStudents = user.role === "ADMIN"
      ? await Student.find({}).populate("program", "title").sort({ regNo: 1 }).lean()
      : await Student.find({ _id: { $in: accessibleIds ?? [] } }).populate("program", "title").sort({ regNo: 1 }).lean();
    const resolved = resolvePortalStudentId(user.role, requestedId, availableStudents.map((student) => String(student._id)));
    if (resolved.status !== 200) return NextResponse.json({ success: false, message: "Student not found or access denied." }, { status: resolved.status });
    const selected = resolved.id ? availableStudents.find((student) => String(student._id) === resolved.id) : null;
    if (requestedId && !selected && user.role !== "ADMIN") return NextResponse.json({ success: false, message: "Student not found or access denied." }, { status: 404 });
    const studentIds = selected ? [selected._id] : user.role === "ADMIN" ? availableStudents.map((student) => student._id) : [];
    const studentOptions = availableStudents.map(serializeStudent);
    const { start, end } = monthBounds(month);
    const selectedId = selected ? String(selected._id) : null;
    const noticeStudents = selected ? [selected] : availableStudents;
    const programIds = noticeStudents.map((student) => student.program && typeof student.program === "object" ? (student.program as { _id: unknown })._id : student.program);

    if (view === "counseling") {
      if (user.role !== "PARENT") return NextResponse.json({ success: false, message: "Counseling bookings are available to parent accounts." }, { status: 403 });
      const bookings = await CounselingBooking.find({ requestedBy: user.id }).sort({ preferredDate: -1 }).limit(100).lean();
      return NextResponse.json({ success: true, data: { students: studentOptions, selectedStudentId: selectedId, bookings } }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (view === "notices") {
      const audience = user.role === "PARENT" ? ["all", "parents"] : ["all", "students"];
      const notices = await Notice.find({
        publishedAt: { $lte: new Date() },
        $and: [
          { $or: [{ audience: { $in: audience } }, { audience: "program", program: { $in: programIds } }] },
          { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
        ],
      }).sort({ pinned: -1, publishedAt: -1 }).limit(100).lean();
      return NextResponse.json({ success: true, data: { students: studentOptions, selectedStudentId: selectedId, notices: notices.map((notice) => ({ ...notice, id: String(notice._id), unread: !(notice.readBy ?? []).some((id: unknown) => String(id) === user.id) })) } }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (view === "attendance") {
      const records = selectedId ? await Attendance.find({ student: studentIds[0], date: { $gte: start, $lt: end } }).sort({ date: 1 }).lean() : [];
      const denominator = records.filter((record) => record.status !== "Leave").length;
      const percentage = denominator ? Math.round((records.filter((record) => record.status === "Present" || record.status === "Late").length / denominator) * 100) : 0;
      return NextResponse.json({ success: true, data: { students: studentOptions, selectedStudentId: selectedId, month, records: records.map((record) => ({ id: String(record._id), date: record.date, status: record.status })), percentage } }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (view === "results" || view === "progress") {
      const exams = selectedId ? await Assessment.find({ student: studentIds[0], publishedAt: { $ne: null } }).sort({ publishedAt: 1 }).lean() : [];
      const results = exams.map((exam) => ({ id: String(exam._id), examName: exam.examName, term: exam.term, subjects: exam.subjects, percentage: exam.percentage, grade: exam.grade, remarks: exam.remarks, publishedAt: exam.publishedAt }));
      const attendance = selectedId && view === "progress" ? await Attendance.find({ student: studentIds[0] }).sort({ date: 1 }).limit(366).lean() : [];
      return NextResponse.json({ success: true, data: { students: studentOptions, selectedStudentId: selectedId, results, attendance: attendance.map((record) => ({ date: record.date, status: record.status })) } }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (view === "assignments") {
      const selectedProgram = selected?.program && typeof selected.program === "object" ? (selected.program as { _id: unknown })._id : selected?.program;
      const assignments = selected ? await Assignment.find({
        $or: [
          { program: selectedProgram, $or: [{ classLevel: "" }, { classLevel: selected.classLevel }] },
          { program: null },
        ],
      }).sort({ dueDate: 1 }).limit(100).lean() : [];
      const submissions = selectedId ? await AssignmentSubmission.find({ student: studentIds[0], assignment: { $in: assignments.map((assignment) => assignment._id) } }).lean() : [];
      const submitted = new Map(submissions.map((submission) => [String(submission.assignment), submission]));
      return NextResponse.json({ success: true, data: { students: studentOptions, selectedStudentId: selectedId, assignments: assignments.map((assignment) => ({ id: String(assignment._id), title: assignment.title, description: assignment.description, dueDate: assignment.dueDate, fileUrl: assignment.fileUrl, submission: submitted.get(String(assignment._id)) ? { submittedAt: submitted.get(String(assignment._id))?.submittedAt } : null })) } }, { headers: { "Cache-Control": "private, no-store" } });
    }

    const monthAttendance = selectedId ? await Attendance.find({ student: studentIds[0], date: { $gte: start, $lt: end } }).lean() : [];
    const eligibleDays = monthAttendance.filter((record) => record.status !== "Leave");
    const attendancePercent = eligibleDays.length ? Math.round((eligibleDays.filter((record) => record.status === "Present" || record.status === "Late").length / eligibleDays.length) * 100) : 0;
    const [nextChallan, latestResult, upcomingAssignments, notices, results, allAttendance, feeRecords] = selectedId ? await Promise.all([
      FeeChallan.findOne({ student: studentIds[0], status: { $nin: ["Paid", "Cancelled"] } }).sort({ dueDate: 1 }).select("challanNo total paidAmount dueDate status periodMonth").lean(),
      Assessment.findOne({ student: studentIds[0], publishedAt: { $ne: null } }).sort({ publishedAt: -1 }).select("examName percentage grade publishedAt").lean(),
      Assignment.find({
        $or: [
          { program: selected?.program && typeof selected.program === "object" ? (selected.program as { _id: unknown })._id : selected?.program, $or: [{ classLevel: "" }, { classLevel: selected?.classLevel }] },
          { program: null },
        ],
        dueDate: { $gte: new Date() },
      }).sort({ dueDate: 1 }).limit(5).select("title dueDate").lean(),
      Notice.find({ publishedAt: { $lte: new Date() }, $or: [{ audience: "all" }, { audience: user.role === "PARENT" ? "parents" : "students" }, { audience: "program", program: { $in: programIds } }], $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] }] }).sort({ pinned: -1, publishedAt: -1 }).limit(5).lean(),
      Assessment.find({ student: studentIds[0], publishedAt: { $ne: null } }).sort({ publishedAt: 1 }).select("examName percentage grade publishedAt").lean(),
      Attendance.find({ student: studentIds[0] }).sort({ date: 1 }).limit(366).lean(),
      FeeChallan.find({ student: studentIds[0] }).sort({ periodMonth: -1 }).limit(12).select("challanNo periodMonth total paidAmount dueDate status").lean(),
    ]) : [null, null, [], [], [], [], []];
    const dashboard = {
      timing: academy.timing,
      month,
      attendancePercent,
      attendanceCount: eligibleDays.length,
      nextChallan,
      latestResult,
      upcomingAssignments,
      notices: notices.map((notice) => ({ id: String(notice._id), title: notice.title, pinned: notice.pinned, publishedAt: notice.publishedAt, unread: !(notice.readBy ?? []).some((id: unknown) => String(id) === user.id) })),
    };
    return NextResponse.json({ success: true, data: { students: studentOptions, selectedStudentId: selectedId, dashboard, results: results.map((exam) => ({ id: String(exam._id), examName: exam.examName, percentage: exam.percentage, grade: exam.grade, publishedAt: exam.publishedAt })), attendance: allAttendance.map((record) => ({ date: record.date, status: record.status })), fees: feeRecords } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET /api/portal failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load portal information." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    const input = body as Record<string, unknown>;
    if (input.action !== "mark-notice-read" || !isValidObjectId(input.noticeId)) return NextResponse.json({ success: false, message: "Invalid notice update." }, { status: 400 });
    await connectDB();
    const notice = await Notice.findById(input.noticeId).select("audience program").lean();
    if (!notice) return NextResponse.json({ success: false, message: "Notice not found." }, { status: 404 });
    const visibleNotice = await Notice.exists({ _id: input.noticeId, publishedAt: { $lte: new Date() }, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] });
    if (!visibleNotice) return NextResponse.json({ success: false, message: "Notice not found." }, { status: 404 });
    if (user.role !== "ADMIN") {
      if (!["STUDENT", "PARENT"].includes(user.role)) return NextResponse.json({ success: false, message: "Access denied." }, { status: 403 });
      const ids = await getAccessibleStudentIds(user);
      const programIds = await Student.find({ _id: { $in: ids ?? [] } }).distinct("program");
      const audienceMatch = notice.audience === "all" || notice.audience === (user.role === "PARENT" ? "parents" : "students") || (notice.audience === "program" && programIds.some((id) => String(id) === String(notice.program)));
      if (!audienceMatch) return NextResponse.json({ success: false, message: "Notice not found." }, { status: 404 });
    }
    await Notice.updateOne({ _id: input.noticeId }, { $addToSet: { readBy: user.id } });
    return NextResponse.json({ success: true, data: { marked: true } });
  } catch (error) {
    console.error("PATCH /api/portal failed:", error);
    return NextResponse.json({ success: false, message: "Unable to update this notice." }, { status: 500 });
  }
}
