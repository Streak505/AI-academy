import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { fail, ok, paginate, requireAuth } from "@/lib/api";
import { GalleryItem } from "@/models/GalleryItem";
import { isValidEnum, isValidObjectId, isValidString } from "@/lib/validations";
import { recordAdminAudit } from "@/lib/admin-audit";

const categories = ["events", "workshops", "achievements", "csr"] as const;

function validGalleryItem(body: Record<string, unknown>) {
  return isValidString(body.title, 2, 180)
    && isValidEnum(body.category, categories)
    && isValidString(body.imageUrl, 8, 2048)
    && (body.caption === undefined || typeof body.caption === "string")
    && (body.isPublished === undefined || typeof body.isPublished === "boolean")
    && (body.order === undefined || (Number.isSafeInteger(body.order) && Number(body.order) >= 0));
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const { page, limit, skip } = paginate(new URL(request.url).searchParams);
    await connectDB();
    const [items, total] = await Promise.all([
      GalleryItem.find().sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      GalleryItem.countDocuments(),
    ]);
    return ok({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET /api/admin/gallery failed:", error);
    return fail("Unable to load gallery items.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const body = await request.json() as Record<string, unknown>;
    if (!validGalleryItem(body)) return fail("Gallery item details are invalid.", 400);
    await connectDB();
    const item = await GalleryItem.create({
      title: body.title, caption: body.caption ?? "", category: body.category,
      imageUrl: body.imageUrl, order: body.order ?? 0, isPublished: body.isPublished ?? true,
    });
    await recordAdminAudit(auth.user, request, "GALLERY_ITEM_CREATED", "GalleryItem", String(item._id), { title: item.title });
    revalidatePath("/gallery");
    return ok(item, 201);
  } catch (error) {
    console.error("POST /api/admin/gallery failed:", error);
    return fail("Could not create gallery item.", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const body = await request.json() as Record<string, unknown>;
    const id = String(body.id ?? body._id ?? "");
    if (!isValidObjectId(id)) return fail("A valid gallery item id is required.", 400);
    if (!validGalleryItem(body)) return fail("Gallery item details are invalid.", 400);
    await connectDB();
    const updated = await GalleryItem.findByIdAndUpdate(id, {
      title: body.title, caption: body.caption ?? "", category: body.category,
      imageUrl: body.imageUrl, order: body.order ?? 0, isPublished: body.isPublished ?? true,
    }, { new: true, runValidators: true });
    if (updated) await recordAdminAudit(auth.user, request, "GALLERY_ITEM_UPDATED", "GalleryItem", id, { title: updated.title });
    if (updated) revalidatePath("/gallery");
    return updated ? ok(updated) : fail("Gallery item not found.", 404);
  } catch (error) {
    console.error("PUT /api/admin/gallery failed:", error);
    return fail("Could not update gallery item.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const id = new URL(request.url).searchParams.get("id") || "";
    if (!isValidObjectId(id)) return fail("A valid gallery item id is required.", 400);
    await connectDB();
    const deleted = await GalleryItem.findByIdAndDelete(id);
    if (deleted) await recordAdminAudit(auth.user, request, "GALLERY_ITEM_DELETED", "GalleryItem", id, { title: deleted.title });
    if (deleted) revalidatePath("/gallery");
    return deleted ? ok({ message: "Gallery item deleted." }) : fail("Gallery item not found.", 404);
  } catch (error) {
    console.error("DELETE /api/admin/gallery failed:", error);
    return fail("Could not delete gallery item.", 500);
  }
}
