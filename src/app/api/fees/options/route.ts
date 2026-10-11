import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Program } from "@/models/Program";
import { Student } from "@/models/Student";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ success: false, message: "Administrator access is required." }, { status: 403 });
    await connectDB();
    const [programs, students] = await Promise.all([
      Program.find().select("title level").sort({ title: 1 }).lean(),
      Student.find({ status: "active" }).select("fullName regNo classLevel program").populate("program", "title").sort({ regNo: 1 }).limit(2000).lean(),
    ]);
    return NextResponse.json({ success: true, data: {
      programs: programs.map((program) => ({ id: String(program._id), title: program.title, level: program.level })),
      students: students.map((student) => ({
        id: String(student._id),
        fullName: student.fullName,
        regNo: student.regNo,
        classLevel: student.classLevel,
        program: student.program && typeof student.program === "object" ? { id: String(student.program._id), title: student.program.title } : null,
      })),
    } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET /api/fees/options failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load fee management options." }, { status: 500 });
  }
}
