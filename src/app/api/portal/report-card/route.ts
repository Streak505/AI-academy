import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getAccessibleStudentIds } from "@/lib/fee-access";
import { Assessment } from "@/models/Assessment";
import { Student } from "@/models/Student";
import { isValidObjectId } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (!["STUDENT", "PARENT", "ADMIN"].includes(user.role)) return NextResponse.json({ success: false, message: "You do not have access to this report." }, { status: 403 });
    const studentId = request.nextUrl.searchParams.get("studentId");
    if (!studentId || !isValidObjectId(studentId)) return NextResponse.json({ success: false, message: "Choose a valid student." }, { status: 400 });
    await connectDB();
    const accessibleIds = await getAccessibleStudentIds(user);
    if (accessibleIds && !accessibleIds.includes(studentId)) return NextResponse.json({ success: false, message: "Student not found or access denied." }, { status: user.role === "STUDENT" ? 403 : 404 });
    const student = await Student.findById(studentId).populate("program", "title").lean();
    if (!student) return NextResponse.json({ success: false, message: "Student not found." }, { status: 404 });
    const assessments = await Assessment.find({ student: studentId, publishedAt: { $ne: null } }).sort({ publishedAt: 1 }).lean();
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    let page = pdf.addPage([595, 842]);
    let y = 790;
    const write = (text: string, size = 11, strong = false) => {
      if (y < 60) { page = pdf.addPage([595, 842]); y = 790; }
      page.drawText(text.replace(/[^\x20-\x7E]/g, " "), { x: 48, y, size, font: strong ? bold : font, color: rgb(0.08, 0.16, 0.22), maxWidth: 500 });
      y -= size + 9;
    };
    write("SHAHZAIB ROYAL ACADEMY", 18, true);
    write("Student progress report", 14, true);
    write(`Student: ${student.fullName}`);
    write(`Registration: ${student.regNo}    Class: ${student.classLevel}`);
    write(`Program: ${student.program && typeof student.program === "object" ? (student.program as { title?: string }).title || "" : ""}`);
    y -= 10;
    for (const exam of assessments) {
      write(`${exam.examName} — ${exam.term} | ${exam.percentage}% | Grade: ${exam.grade}`, 12, true);
      for (const subject of exam.subjects) write(`  ${subject.name}: ${subject.obtainedMarks} / ${subject.totalMarks}`);
      if (exam.remarks) write(`  Teacher remarks: ${exam.remarks}`);
      y -= 6;
    }
    if (!assessments.length) write("No published results are available yet.");
    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="report-card-${student.regNo}.pdf"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    console.error("GET /api/portal/report-card failed:", error);
    return NextResponse.json({ success: false, message: "Unable to generate this report card." }, { status: 500 });
  }
}
