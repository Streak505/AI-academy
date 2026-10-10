import { connectDB, describeMongoError, getSafeDbInfo } from "@/lib/db";
import { Course } from "@/models/Course";
import { Event } from "@/models/Event";
import { Instructor } from "@/models/Instructor";
import { News } from "@/models/News";
import { Review } from "@/models/Review";
import { Program } from "@/models/Program";
import { CsrInitiative } from "@/models/CsrInitiative";
import { GalleryItem } from "@/models/GalleryItem";
import { Student } from "@/models/Student";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbInfo = getSafeDbInfo();
  const env = {
    hasMongoUri: Boolean(process.env.MONGODB_URI?.trim()),
    hasJwtSecret: Boolean(process.env.JWT_SECRET?.trim()),
    hasJwtRefreshSecret: Boolean(process.env.JWT_REFRESH_SECRET?.trim()),
    nodeEnv: process.env.NODE_ENV || "development",
  };
  const emptyCounts = {
    courses: 0,
    featuredCourses: 0,
    instructors: 0,
    reviews: 0,
    news: 0,
    events: 0,
    programs: 0,
    csrInitiatives: 0,
    galleryItems: 0,
    students: 0,
  };

  try {
    await connectDB();
    const [courses, featuredCourses, instructors, reviews, news, events, programs, csrInitiatives, galleryItems, students] = await Promise.all([
      Course.countDocuments({ isPublished: true }),
      Course.countDocuments({ isPublished: true, isFeatured: true }),
      Instructor.countDocuments({ isActive: true }),
      Review.countDocuments({ isPublished: true }),
      News.countDocuments({ isPublished: true }),
      Event.countDocuments({ isPublished: true }),
      Program.countDocuments({ isPublished: true }),
      CsrInitiative.countDocuments({ isPublished: true }),
      GalleryItem.countDocuments({ isPublished: true }),
      Student.countDocuments({ status: "active" }),
    ]);

    return Response.json({
      success: true,
      ok: true,
      time: new Date().toISOString(),
      db: { connected: true, ...dbInfo },
      env,
      counts: { courses, featuredCourses, instructors, reviews, news, events, programs, csrInitiatives, galleryItems, students },
    });
  } catch (error) {
    const { code, message } = describeMongoError(error);
    console.error(`[Health check ${code}] ${message}`);

    return Response.json({
      success: false,
      ok: false,
      time: new Date().toISOString(),
      db: { connected: false, ...dbInfo, errorCode: code },
      env,
      counts: emptyCounts,
    }, { status: 503 });
  }
}
