import { NextRequest } from "next/server";
import { connectToDatabase, logMongoError } from "@/lib/db";
import { Review } from "@/models/Review";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { isValidRating, isValidString } from "@/lib/validations";
import { getCurrentUser } from "@/lib/user-auth";
import { isValidObjectId } from "@/lib/validations";
import { requireAdminResponse } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const searchParams = new URL(request.url).searchParams;
    const isAdmin = searchParams.get("admin") === "true";
    if (isAdmin) {
      const unauthorized = await requireAdminResponse();
      if (unauthorized) return unauthorized;
    }
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 0), 0), 50);
    const reviewsQuery = Review.find(isAdmin ? {} : { isPublished: true }).sort({ isFeatured: -1, createdAt: -1 });
    if (limit) reviewsQuery.limit(limit);
    const reviews = await reviewsQuery.lean();
    return Response.json({ success: true, data: reviews });
  } catch (error) {
    logMongoError("GET /api/reviews", error);
    return Response.json({ success: false, message: "Unable to load reviews." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    const body = await request.json();
    const reviewId = String(body?._id || body?.id || "");
    if (!isValidObjectId(reviewId)) return Response.json({ success: false, message: "A valid review id is required." }, { status: 400 });
    const updates: Record<string, unknown> = {};
    if (body.rating !== undefined) {
      if (!isValidRating(body.rating)) return Response.json({ success: false, message: "Rating must be between 1 and 5." }, { status: 400 });
      updates.rating = Number(body.rating);
    }
    if (body.review !== undefined) {
      if (!isValidString(body.review, 20, 1000)) return Response.json({ success: false, message: "Review text is invalid." }, { status: 400 });
      updates.review = body.review;
    }
    if (body.isPublished !== undefined) updates.isPublished = Boolean(body.isPublished);
    if (body.isFeatured !== undefined) updates.isFeatured = Boolean(body.isFeatured);
    const review = await Review.findByIdAndUpdate(reviewId, updates, { new: true }).lean();
    return review ? Response.json({ success: true, data: review }) : Response.json({ success: false, message: "Review not found." }, { status: 404 });
  } catch (error) {
    logMongoError("PUT /api/reviews", error);
    return Response.json({ success: false, message: "Could not update review." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const unauthorized = await requireAdminResponse();
    if (unauthorized) return unauthorized;
    const reviewId = new URL(request.url).searchParams.get("id");
    if (!reviewId || !isValidObjectId(reviewId)) return Response.json({ success: false, message: "A valid review id is required." }, { status: 400 });
    const review = await Review.findByIdAndDelete(reviewId);
    return review ? Response.json({ success: true, message: "Review deleted successfully." }) : Response.json({ success: false, message: "Review not found." }, { status: 404 });
  } catch (error) {
    logMongoError("DELETE /api/reviews", error);
    return Response.json({ success: false, message: "Could not delete review." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") {
      return Response.json({ success: false, message: "Please sign in as a student to submit a review." }, { status: 401 });
    }
    await connectToDatabase();
    const body = await request.json();

    if (!body?.name || !isValidString(body.name, 2, 80)) {
      return Response.json({ success: false, message: "Reviewer name is required." }, { status: 400 });
    }

    if (!body?.course || typeof body.course !== "string" || !isValidObjectId(body.course)) {
      return Response.json({ success: false, message: "Course reference is required." }, { status: 400 });
    }

    if (!isValidRating(body.rating)) {
      return Response.json({ success: false, message: "Rating must be a number between 1 and 5." }, { status: 400 });
    }

    if (!body?.review || !isValidString(body.review, 20, 1000)) {
      return Response.json({ success: false, message: "Review text is required." }, { status: 400 });
    }

    const course = await Course.findById(body.course).select("_id").lean();
    if (!course) return Response.json({ success: false, message: "Course not found." }, { status: 404 });
    const enrollment = await Enrollment.findOne({ student: user.id, course: body.course, status: { $in: ["Active", "Completed"] } }).select("_id").lean();
    if (!enrollment) return Response.json({ success: false, message: "You can only review a course you are enrolled in." }, { status: 403 });
    const existingReview = await Review.exists({ student: user.id, course: body.course });
    if (existingReview) return Response.json({ success: false, message: "You have already reviewed this course." }, { status: 409 });

    const review = await Review.create({
      name: String(body.name).trim(),
      course: body.course,
      review: String(body.review).trim(),
      student: user.id,
      isPublished: false,
      isFeatured: false,
      rating: Number(body.rating),
    });

    return Response.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    logMongoError("POST /api/reviews", error);
    return Response.json({ success: false, message: "Could not create review." }, { status: 500 });
  }
}
