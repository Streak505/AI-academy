import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Please sign in as a student first." }, { status: 401 });
    if (user.role !== "STUDENT") return NextResponse.json({ success: false, message: "Only student accounts can enroll in courses." }, { status: 403 });

    const { courseId } = await request.json();
    if (!courseId) return NextResponse.json({ success: false, message: "Course is required." }, { status: 400 });

    await connectToDatabase();
    const course = await Course.findOne({ _id: courseId, isPublished: true }).lean();
    if (!course) return NextResponse.json({ success: false, message: "Course not found." }, { status: 404 });

    const enrollment = await Enrollment.findOneAndUpdate(
      { student: user.id, course: courseId },
      { $setOnInsert: { student: user.id, course: courseId, status: "Active", progress: 0 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json({ success: true, enrollment, message: "You are enrolled in this course." });
  } catch (error) {
    console.error("Enrollment failed:", error);
    return NextResponse.json({ success: false, message: "Could not enroll in this course." }, { status: 500 });
  }
}
