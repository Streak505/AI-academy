import { NextRequest } from "next/server";
import { connectToDatabase, logMongoError } from "@/lib/db";
import { News } from "@/models/News";
import { isValidString, isValidObjectId } from "@/lib/validations";
import { requireAdmin, requireAdminResponse } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const searchParams = new URL(request.url).searchParams;
    const requestedId = searchParams.get("id");
    if (requestedId) {
      const admin = await requireAdmin();
      if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
      if (!isValidObjectId(requestedId)) return Response.json({ success: false, message: "A valid news id is required." }, { status: 400 });
      const item = await News.findById(requestedId).lean();
      return item ? Response.json({ success: true, data: [item] }) : Response.json({ success: false, message: "News item not found." }, { status: 404 });
    }
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 0), 0), 50);
    const newsQuery = News.find({ isPublished: true }).sort({ publishedAt: -1 });
    if (limit) newsQuery.limit(limit);
    const news = await newsQuery.lean();
    return Response.json({ success: true, data: news });
  } catch (error) {
    logMongoError("GET /api/news", error);
    return Response.json({ success: false, message: "Unable to load news." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    const body = await request.json();

    if (!body?.title || !isValidString(body.title, 3, 200)) {
      return Response.json({ success: false, message: "News title is required." }, { status: 400 });
    }

    if (!body?.content || !isValidString(body.content, 20, 5000)) {
      return Response.json({ success: false, message: "News content is required." }, { status: 400 });
    }

    const item = await News.create({
      ...body,
      slug: body.slug ?? body.title.toLowerCase().split(" ").join("-"),
      isFeatured: body.isFeatured ?? false,
      isPublished: body.isPublished ?? true,
      publishedAt: body.publishedAt ?? new Date(),
    });
    await recordAdminAudit(admin, request, "NEWS_CREATED", "News", String(item._id), { title: item.title });

    return Response.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    logMongoError("POST /api/news", error);
    return Response.json({ success: false, message: "Could not create news item." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    const body = await request.json();
    const newsId = String(body?._id || body?.id || "");

    if (!newsId || !isValidObjectId(newsId)) {
      return Response.json({ success: false, message: "A valid news id is required." }, { status: 400 });
    }

    const news = await News.findById(newsId);
    if (!news) {
      return Response.json({ success: false, message: "News item not found." }, { status: 404 });
    }

    const updated = await News.findByIdAndUpdate(
      newsId,
      { ...body, isPublished: body.isPublished ?? news.isPublished },
      { new: true }
    );
    if (updated) await recordAdminAudit(admin, request, body.isPublished !== undefined && body.isPublished !== news.isPublished ? "NEWS_STATUS_UPDATED" : "NEWS_UPDATED", "News", newsId, { title: updated.title, isPublished: updated.isPublished });

    return Response.json({ success: true, data: updated });
  } catch (error) {
    logMongoError("PUT /api/news", error);
    return Response.json({ success: false, message: "Could not update news item." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get("id");

    if (!newsId || !isValidObjectId(newsId)) {
      return Response.json({ success: false, message: "A valid news id is required." }, { status: 400 });
    }

    const news = await News.findByIdAndDelete(newsId);
    if (!news) {
      return Response.json({ success: false, message: "News item not found." }, { status: 404 });
    }
    await recordAdminAudit(admin, request, "NEWS_DELETED", "News", newsId, { title: news.title });

    return Response.json({ success: true, message: "News item deleted successfully." });
  } catch (error) {
    logMongoError("DELETE /api/news", error);
    return Response.json({ success: false, message: "Could not delete news item." }, { status: 500 });
  }
}
