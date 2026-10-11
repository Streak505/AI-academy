import { randomUUID } from "node:crypto";
import { get, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getAccessibleStudentIds } from "@/lib/fee-access";
import { Assignment } from "@/models/Assignment";
import { AssignmentSubmission } from "@/models/AssignmentSubmission";
import { Student } from "@/models/Student";
import { isValidObjectId } from "@/lib/validations";
import { getPrivateBlobToken } from "@/lib/blob";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const MAX_FILE_SIZE = 4 * 1024 * 1024;

function isAllowedFile(file: File, bytes: Uint8Array) {
  if (file.type === "application/pdf") return file.name.toLowerCase().endsWith(".pdf") && new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
  if (file.type === "image/jpeg") return /\.(jpe?g)$/i.test(file.name) && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") return /\.png$/i.test(file.name) && bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  return false;
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (user.role !== "STUDENT") return NextResponse.json({ success: false, message: "Only students can submit assignment work." }, { status: 403 });
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ success: false, message: "Invalid assignment." }, { status: 400 });
    const token = getPrivateBlobToken();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size < 1 || file.size > MAX_FILE_SIZE) return NextResponse.json({ success: false, message: "Choose a file smaller than 4 MB." }, { status: 413 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!isAllowedFile(file, bytes)) return NextResponse.json({ success: false, message: "Only valid PDF, JPG, and PNG files are accepted." }, { status: 400 });
    await connectDB();
    const [student, assignment] = await Promise.all([
      Student.findOne({ user: user.id, status: "active" }).select("_id program classLevel").lean(),
      Assignment.findById(id).select("program classLevel").lean(),
    ]);
    if (!student || !assignment || (assignment.program && String(assignment.program) !== String(student.program))
      || (assignment.classLevel && assignment.classLevel !== student.classLevel)) return NextResponse.json({ success: false, message: "Assignment not found." }, { status: 404 });
    const filename = file.name.replace(/[/\\]/g, "_").replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 150);
    const blob = await put(`assignment-submissions/${student._id}/${id}/${randomUUID()}/${filename}`, Buffer.from(bytes), {
      access: "private", addRandomSuffix: true, contentType: file.type, token,
    });
    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignment: id, student: student._id },
      { $set: { fileUrl: blob.url, submittedAt: new Date() }, $setOnInsert: { assignment: id, student: student._id } },
      { upsert: true, new: true, runValidators: true },
    );
    return NextResponse.json({ success: true, data: { submittedAt: submission.submittedAt } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/portal/assignments/[id]/submission failed:", error);
    return NextResponse.json({ success: false, message: "Unable to submit this assignment." }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (!["STUDENT", "PARENT", "ADMIN"].includes(user.role)) return NextResponse.json({ success: false, message: "Access denied." }, { status: 403 });
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ success: false, message: "Invalid assignment." }, { status: 400 });
    const token = getPrivateBlobToken();
    await connectDB();
    const ids = await getAccessibleStudentIds(user);
    const filter: Record<string, unknown> = { assignment: id };
    const requestedStudentId = request.nextUrl.searchParams.get("studentId");
    if (requestedStudentId) {
      if (!isValidObjectId(requestedStudentId)) return NextResponse.json({ success: false, message: "Invalid student id." }, { status: 400 });
      if (ids && !ids.includes(requestedStudentId)) return NextResponse.json({ success: false, message: "Student not found or access denied." }, { status: user.role === "STUDENT" ? 403 : 404 });
      filter.student = requestedStudentId;
    } else if (ids) filter.student = { $in: ids };
    const submission = await AssignmentSubmission.findOne(filter).select("fileUrl").lean();
    if (!submission) return NextResponse.json({ success: false, message: "Assignment submission not found." }, { status: 404 });
    const blob = await get(submission.fileUrl, { access: "private", token, useCache: false });
    if (!blob || blob.statusCode !== 200) return NextResponse.json({ success: false, message: "Assignment submission could not be retrieved." }, { status: 404 });
    return new NextResponse(blob.stream, { headers: { "Content-Type": blob.blob.contentType || "application/octet-stream", "Content-Disposition": "attachment", "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    console.error("GET /api/portal/assignments/[id]/submission failed:", error);
    return NextResponse.json({ success: false, message: "Unable to open this assignment submission." }, { status: 500 });
  }
}
