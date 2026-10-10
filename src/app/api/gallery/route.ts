import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { fail, ok, paginate } from "@/lib/api";
import { GalleryItem } from "@/models/GalleryItem";
import { isValidEnum } from "@/lib/validations";

const galleryCategories = ["events", "workshops", "achievements", "csr"] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    if (category && !isValidEnum(category, galleryCategories)) return fail("Invalid gallery category.", 400);

    const { page, limit, skip } = paginate(searchParams);
    await connectDB();
    const filter = { isPublished: true, ...(category ? { category } : {}) };
    const [items, total] = await Promise.all([
      GalleryItem.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      GalleryItem.countDocuments(filter),
    ]);
    return ok({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET /api/gallery failed:", error);
    return fail("Unable to load gallery items.", 500);
  }
}
