import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { Attendance } from "@/models/Attendance";
import { Assessment } from "@/models/Assessment";
import { Assignment } from "@/models/Assignment";
import { Notice } from "@/models/Notice";
import { Program } from "@/models/Program";
import { Student } from "@/models/Student";
import { User } from "@/models/User";
import { isValidObjectId, isValidString } from "@/lib/validations";

const statuses = ["Present", "Absent", "Late", "Leave"] as const;
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

async function getStaffScope(user: { id: string; role: string }) {
  if (user.role === "ADMIN") return null;
  if (user.role !== "INSTRUCTOR") return [];
  const account = await User.findById(user.id).select("assignedPrograms").lean();
  return (account?.assignedPrograms ?? []).map(String);
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (!["ADMIN", "INSTRUCTOR"].includes(user.role)) return NextResponse.json({ success: false, message: "Staff access is required." }, { status: 403 });
    await connectDB();
    const scope = await getStaffScope(user);
    const programFilter = scope ? { _id: { $in: scope } } : {};
    const [programs, instructors] = await Promise.all([
      Program.find(programFilter).select("title level").sort({ title: 1 }).lean(),
      user.role === "ADMIN" ? User.find({ role: "INSTRUCTOR" }).select("name email assignedPrograms").sort({ name: 1 }).lean() : Promise.resolve([]),
    ]);
    const students = await Student.find({ status: "active", ...(scope ? { program: { $in: scope } } : {}) })
      .select("fullName regNo classLevel program").populate("program", "title").sort({ regNo: 1 }).lean();
    return NextResponse.json({ success: true, data: { programs: programs.map((program) => ({ id: String(program._id), title: program.title, level: program.level })), students: students.map((student) => ({ id: String(student._id), fullName: student.fullName, regNo: student.regNo, classLevel: student.classLevel, programId: String(student.program && typeof student.program === "object" ? (student.program as { _id: unknown })._id : student.program) })), instructors: instructors.map((instructor) => ({ id: String(instructor._id), name: instructor.name, email: instructor.email, assignedPrograms: (instructor.assignedPrograms || []).map(String) })) } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET /api/portal/academic failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load academic records." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (!["ADMIN", "INSTRUCTOR"].includes(user.role)) return NextResponse.json({ success: false, message: "Staff access is required." }, { status: 403 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    const input = body as Record<string, unknown>;
    await connectDB();
    if (input.action === "assign-programs") {
      if (user.role !== "ADMIN") return NextResponse.json({ success: false, message: "Administrator access is required." }, { status: 403 });
      if (!isValidObjectId(input.instructorId) || !Array.isArray(input.programIds) || input.programIds.length > 100 || !input.programIds.every(isValidObjectId)) {
        return NextResponse.json({ success: false, message: "Choose an instructor and valid programs." }, { status: 400 });
      }
      const instructor = await User.findOne({ _id: input.instructorId, role: "INSTRUCTOR" }).select("_id").lean();
      const programs = await Program.find({ _id: { $in: input.programIds } }).select("_id").lean();
      if (!instructor || programs.length !== input.programIds.length) return NextResponse.json({ success: false, message: "Instructor or program not found." }, { status: 404 });
      await User.updateOne({ _id: input.instructorId, role: "INSTRUCTOR" }, { $set: { assignedPrograms: input.programIds } });
      return NextResponse.json({ success: true, data: { saved: true } });
    }
    const allowedPrograms = await getStaffScope(user);
    const canManageProgram = async (programId: unknown) => isValidObjectId(programId) && (!allowedPrograms || allowedPrograms.includes(programId));
    const ensureStudents = async (ids: unknown) => {
      if (!Array.isArray(ids) || ids.length < 1 || ids.length > 250 || !ids.every(isValidObjectId)) return null;
      const students = await Student.find({ _id: { $in: ids }, status: "active" }).select("_id program fullName").lean();
      if (students.length !== ids.length || students.some((student) => allowedPrograms && !allowedPrograms.includes(String(student.program)))) return null;
      return students;
    };

    if (input.action === "attendance") {
      if (typeof input.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !Array.isArray(input.records) || input.records.length < 1 || input.records.length > 250) {
        return NextResponse.json({ success: false, message: "Choose a valid class date and attendance list." }, { status: 400 });
      }
      const date = new Date(`${input.date}T12:00:00.000Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input.date
        || !weekdays.includes(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", weekday: "short" }).format(date))) {
        return NextResponse.json({ success: false, message: "Attendance can only be marked Monday through Saturday." }, { status: 400 });
      }
      const records = input.records as Record<string, unknown>[];
      const ids = records.map((record) => record.studentId);
      if (records.some((record) => !isValidObjectId(record.studentId) || !statuses.includes(record.status as (typeof statuses)[number])) || new Set(ids).size !== ids.length) {
        return NextResponse.json({ success: false, message: "Attendance contains an invalid or duplicate student." }, { status: 400 });
      }
      const students = await ensureStudents(ids);
      if (!students) return NextResponse.json({ success: false, message: "A student was not found or is outside your assigned programs." }, { status: 403 });
      const day = new Date(`${input.date}T00:00:00+05:00`);
      await Promise.all(records.map((record) => Attendance.findOneAndUpdate(
        { student: String(record.studentId), date: day },
        { $set: { status: record.status, markedBy: user.id }, $setOnInsert: { student: String(record.studentId), date: day } },
        { upsert: true, new: true, runValidators: true },
      )));
      await Promise.all(records.filter((record) => record.status === "Absent").map((record) => notify({
        studentId: String(record.studentId), type: "Absent", key: `absent:${record.studentId}:${input.date}`, detail: String(input.date),
      })));
      return NextResponse.json({ success: true, data: { saved: records.length } });
    }

    if (input.action === "results") {
      if (!isValidString(input.examName, 2, 120) || !isValidString(input.term, 1, 80) || !Array.isArray(input.records) || input.records.length < 1 || input.records.length > 250) {
        return NextResponse.json({ success: false, message: "Enter an exam, term, and at least one student result." }, { status: 400 });
      }
      const records = input.records as Record<string, unknown>[];
      const ids = records.map((record) => record.studentId);
      if (records.some((record) => !isValidObjectId(record.studentId) || !Array.isArray(record.subjects) || record.subjects.length < 1 || record.subjects.length > 30)
        || new Set(ids).size !== ids.length) return NextResponse.json({ success: false, message: "Results contain invalid or duplicate students." }, { status: 400 });
      const students = await ensureStudents(ids);
      if (!students) return NextResponse.json({ success: false, message: "A student was not found or is outside your assigned programs." }, { status: 403 });
      const validated = records.map((record) => {
        const subjects = record.subjects as Record<string, unknown>[];
        if (subjects.some((subject) => !isValidString(subject.name, 1, 100) || !Number.isInteger(subject.totalMarks) || Number(subject.totalMarks) < 1 || !Number.isInteger(subject.obtainedMarks) || Number(subject.obtainedMarks) < 0 || Number(subject.obtainedMarks) > Number(subject.totalMarks))) return null;
        const total = subjects.reduce((sum, subject) => sum + Number(subject.totalMarks), 0);
        const obtained = subjects.reduce((sum, subject) => sum + Number(subject.obtainedMarks), 0);
        return { studentId: String(record.studentId), subjects, percentage: Math.round((obtained / total) * 10000) / 100 };
      });
      if (validated.some((record) => !record)) {
        return NextResponse.json({ success: false, message: "Each subject must have valid obtained and total marks." }, { status: 400 });
      }
      const studentById = new Map(students.map((student) => [String(student._id), student]));
      const publishedAt = new Date();
      const assessments = await Assessment.insertMany(validated.map((record) => {
        const student = studentById.get(record!.studentId)!;
        return {
          student: student._id, program: student.program, examName: String(input.examName).trim(), term: String(input.term).trim(),
          subjects: record!.subjects, percentage: record!.percentage, grade: typeof input.grade === "string" ? input.grade.trim().slice(0, 20) : "",
          remarks: typeof input.remarks === "string" ? input.remarks.trim().slice(0, 1000) : "", publishedAt,
        };
      }));
      await Promise.all(assessments.map((assessment) => notify({
        studentId: String(assessment.student), type: "Result", key: `result:${assessment._id}`, detail: `${assessment.examName} (${assessment.percentage}%)`,
      })));
      return NextResponse.json({ success: true, data: { saved: assessments.length } }, { status: 201 });
    }

    if (input.action === "assignment") {
      if (!await canManageProgram(input.programId) || !isValidString(input.title, 2, 160) || !isValidString(input.description, 1, 4000)
        || typeof input.dueDate !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input.dueDate)
        || (input.fileUrl !== undefined && input.fileUrl !== "" && (typeof input.fileUrl !== "string" || !/^https:\/\//.test(input.fileUrl)))) {
        return NextResponse.json({ success: false, message: "Enter a valid assignment and program." }, { status: 400 });
      }
      const dueDate = new Date(`${input.dueDate}:00+05:00`);
      if (Number.isNaN(dueDate.getTime())) return NextResponse.json({ success: false, message: "Enter a valid due date." }, { status: 400 });
      const classLevel = typeof input.classLevel === "string" ? input.classLevel.trim().slice(0, 80) : "";
      if (classLevel && !await Student.exists({ program: input.programId, classLevel, status: "active" })) {
        return NextResponse.json({ success: false, message: "Choose a class level in the selected program." }, { status: 400 });
      }
      const assignment = await Assignment.create({ program: input.programId, classLevel, title: String(input.title).trim(), description: String(input.description).trim(), dueDate, fileUrl: input.fileUrl || "", postedBy: user.id });
      return NextResponse.json({ success: true, data: { id: String(assignment._id) } }, { status: 201 });
    }

    if (input.action === "notice") {
      const audience = input.audience;
      if (!isValidString(input.title, 2, 160) || !isValidString(input.body, 2, 4000) || !["all", "students", "parents", "program"].includes(String(audience))
        || (audience === "program" && !await canManageProgram(input.programId))) {
        return NextResponse.json({ success: false, message: "Enter a valid notice and audience." }, { status: 400 });
      }
      const notice = await Notice.create({ title: String(input.title).trim(), body: String(input.body).trim(), audience, program: audience === "program" ? input.programId : null, pinned: input.pinned === true, publishedAt: new Date() });
      return NextResponse.json({ success: true, data: { id: String(notice._id) } }, { status: 201 });
    }
    return NextResponse.json({ success: false, message: "Invalid academic action." }, { status: 400 });
  } catch (error) {
    console.error("POST /api/portal/academic failed:", error);
    return NextResponse.json({ success: false, message: "Unable to save academic records." }, { status: 500 });
  }
}
