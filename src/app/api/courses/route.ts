import { NextRequest } from "next/server";
import { connectToDatabase, logMongoError } from "@/lib/db";
import { Course } from "@/models/Course";

// DEPRECATED: not part of Shahzaib Royal Academy scope
import { Category } from "@/models/Category";
import { Instructor } from "@/models/Instructor";
import { isValidObjectId, isValidPrice, isValidString } from "@/lib/validations";
import { requireAdmin, requireAdminResponse } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const requestedId = searchParams.get("id");
    if (requestedId) {
      const admin = await requireAdmin();
      if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
      if (!isValidObjectId(requestedId)) return Response.json({ success: false, message: "A valid course id is required." }, { status: 400 });
      const course = await Course.findById(requestedId).populate("category").populate("instructor").lean();
      return course ? Response.json({ success: true, data: [course] }) : Response.json({ success: false, message: "Course not found." }, { status: 404 });
    }
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    const mode = searchParams.get("mode");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 0), 0), 50);

    const query: Record<string, unknown> = { isPublished: true };

    if (featured === "true") query.isFeatured = true;

    if (category && isValidObjectId(category)) query.category = category;
    if (level && ["Beginner", "Intermediate", "Advanced"].includes(level)) query.level = level;
    if (mode && ["Online", "Onsite", "Hybrid"].includes(mode)) query.mode = mode;
    if (search && isValidString(search, 1, 80)) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
      ];
    }

    const coursesQuery = Course.find(query)
      .populate("category")
      .populate("instructor")
      .sort({ isFeatured: -1, createdAt: -1 });
    if (limit) coursesQuery.limit(limit);
    const courses = await coursesQuery.lean();

    return Response.json({ success: true, data: courses });
  } catch (error) {
    logMongoError("GET /api/courses", error);
    return Response.json({ success: false, message: "Unable to load courses." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    const body = await request.json();

    if (!body?.title || !isValidString(body.title, 3, 120)) {
      return Response.json({ success: false, message: "Course title is required." }, { status: 400 });
    }

    if (!body?.slug || !isValidString(body.slug, 3, 120)) {
      return Response.json({ success: false, message: "Course slug is required." }, { status: 400 });
    }

    if (!body?.description || !isValidString(body.description, 20, 5000)) {
      return Response.json({ success: false, message: "Course description is required." }, { status: 400 });
    }

    if (!body?.category || !isValidObjectId(body.category)) {
      return Response.json({ success: false, message: "A valid category is required." }, { status: 400 });
    }

    if (!body?.instructor || !isValidObjectId(body.instructor)) {
      return Response.json({ success: false, message: "A valid instructor is required." }, { status: 400 });
    }

    if (!body?.duration || !isValidString(body.duration, 2, 40)) {
      return Response.json({ success: false, message: "Course duration is required." }, { status: 400 });
    }

    if (!body?.level || !["Beginner", "Intermediate", "Advanced"].includes(body.level)) {
      return Response.json({ success: false, message: "Course level is invalid." }, { status: 400 });
    }

    if (!body?.mode || !["Online", "Onsite", "Hybrid"].includes(body.mode)) {
      return Response.json({ success: false, message: "Course mode is invalid." }, { status: 400 });
    }

    if (!isValidPrice(body.price)) {
      return Response.json({ success: false, message: "Course price is invalid." }, { status: 400 });
    }

    const categoryExists = await Category.findById(body.category);
    const instructorExists = await Instructor.findById(body.instructor);

    if (!categoryExists) {
      return Response.json({ success: false, message: "Category not found." }, { status: 404 });
    }

    if (!instructorExists) {
      return Response.json({ success: false, message: "Instructor not found." }, { status: 404 });
    }

    const course = await Course.create({
      ...body,
      isPublished: body.isPublished ?? true,
      isFeatured: body.isFeatured ?? false,
      price: Number(body.price),
      discountPrice: Number(body.discountPrice ?? 0),
    });
    await recordAdminAudit(admin, request, "COURSE_CREATED", "Course", String(course._id), { title: course.title });

    return Response.json({ success: true, data: course }, { status: 201 });
  } catch (error) {
    logMongoError("POST /api/courses", error);
    return Response.json({ success: false, message: "Could not create course." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    const body = await request.json();
    const courseId = String(body?._id || body?.id || "");

    if (!courseId || !isValidObjectId(courseId)) {
      return Response.json({ success: false, message: "A valid course id is required." }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return Response.json({ success: false, message: "Course not found." }, { status: 404 });
    }

    if (body.title && !isValidString(body.title, 3, 120)) {
      return Response.json({ success: false, message: "Course title is invalid." }, { status: 400 });
    }

    if (body.category && !isValidObjectId(body.category)) {
      return Response.json({ success: false, message: "Course category is invalid." }, { status: 400 });
    }

    const nextCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        ...body,
        price: body.price !== undefined ? Number(body.price) : course.price,
        discountPrice: body.discountPrice !== undefined ? Number(body.discountPrice) : course.discountPrice,
        isPublished: body.isPublished ?? course.isPublished,
        isFeatured: body.isFeatured ?? course.isFeatured,
      },
      { new: true }
    );
    if (nextCourse) await recordAdminAudit(admin, request, body.isPublished !== undefined && body.isPublished !== course.isPublished ? "COURSE_STATUS_UPDATED" : "COURSE_UPDATED", "Course", courseId, { title: nextCourse.title });

    return Response.json({ success: true, data: nextCourse });
  } catch (error) {
    logMongoError("PUT /api/courses", error);
    return Response.json({ success: false, message: "Could not update course." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("id");

    if (!courseId || !isValidObjectId(courseId)) {
      return Response.json({ success: false, message: "A valid course id is required." }, { status: 400 });
    }

    const course = await Course.findByIdAndDelete(courseId);

    if (!course) {
      return Response.json({ success: false, message: "Course not found." }, { status: 404 });
    }
    await recordAdminAudit(admin, request, "COURSE_DELETED", "Course", courseId, { title: course.title });

    return Response.json({ success: true, message: "Course deleted successfully." });
  } catch (error) {
    logMongoError("DELETE /api/courses", error);
    return Response.json({ success: false, message: "Could not delete course." }, { status: 500 });
  }
}
