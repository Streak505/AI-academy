import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Course } from "@/models/Course";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";
import { Admission } from "@/models/Admission";
import { ContactMessage } from "@/models/ContactMessage";
import { Review } from "@/models/Review";
import { requireAdminResponse } from "@/lib/admin-auth";

export async function GET() {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    await connectToDatabase();

    const [students, totalCourses, activeCourses, instructors, enrollments, pendingApplications, unreadMessages, publishedReviews] = await Promise.all([
      User.countDocuments({ role: "STUDENT" }),
      Course.countDocuments({}),
      Course.countDocuments({ isPublished: true }),
      User.countDocuments({ role: "INSTRUCTOR" }),
      Enrollment.countDocuments({}),
      Admission.countDocuments({ status: { $in: ["Submitted", "UnderReview"] } }),
      ContactMessage.countDocuments({ status: "Unread" }),
      Review.countDocuments({ isPublished: true }),
    ]);

    const recentApplications = await Admission.find().sort({ submittedAt: -1 }).limit(5).lean();
    const recentReviews = await Review.find({ isPublished: true }).sort({ createdAt: -1 }).limit(5).lean();

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalStudents: students,
          totalCourses,
          activeCourses,
          totalInstructors: instructors,
          totalEnrollments: enrollments,
          pendingApplications,
          unreadMessages,
          publishedReviews,
        },
        recentApplications,
        recentReviews,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load dashboard data." }, { status: 500 });
  }
}
