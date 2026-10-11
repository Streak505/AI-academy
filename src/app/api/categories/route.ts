import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";
import { isValidString, isValidObjectId } from "@/lib/validations";
import { requireAdmin, requireAdminResponse } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const requestedId = new URL(request.url).searchParams.get("id");
    if (requestedId) {
      const admin = await requireAdmin();
      if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
      if (!isValidObjectId(requestedId)) return Response.json({ success: false, message: "A valid category id is required." }, { status: 400 });
      const category = await Category.findById(requestedId).lean();
      return category ? Response.json({ success: true, data: [category] }) : Response.json({ success: false, message: "Category not found." }, { status: 404 });
    }
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    return Response.json({ success: true, data: categories });
  } catch (error) {
    console.error("GET /api/categories failed:", error);
    return Response.json({ success: false, message: "Unable to load categories." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    const body = await request.json();

    if (!body?.name || !isValidString(body.name, 2, 100)) {
      return Response.json({ success: false, message: "Category name is invalid." }, { status: 400 });
    }

    if (!body?.slug || !isValidString(body.slug, 2, 100)) {
      return Response.json({ success: false, message: "Category slug is invalid." }, { status: 400 });
    }

    const category = await Category.create({
      name: body.name,
      slug: body.slug,
      description: body.description ?? "",
      image: body.image ?? "",
      isActive: body.isActive ?? true,
    });
    await recordAdminAudit(admin, request, "CATEGORY_CREATED", "Category", String(category._id), { name: category.name });

    return Response.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories failed:", error);
    return Response.json({ success: false, message: "Could not create category." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    const body = await request.json();
    const categoryId = String(body?._id || body?.id || "");

    if (!categoryId || !isValidObjectId(categoryId)) {
      return Response.json({ success: false, message: "A valid category id is required." }, { status: 400 });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return Response.json({ success: false, message: "Category not found." }, { status: 404 });
    }

    const updated = await Category.findByIdAndUpdate(
      categoryId,
      { ...body, isActive: body.isActive ?? category.isActive },
      { new: true }
    );
    if (updated) await recordAdminAudit(admin, request, body.isActive !== undefined && body.isActive !== category.isActive ? "CATEGORY_STATUS_UPDATED" : "CATEGORY_UPDATED", "Category", categoryId, { name: updated.name });

    return Response.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/categories failed:", error);
    return Response.json({ success: false, message: "Could not update category." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Response.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("id");

    if (!categoryId || !isValidObjectId(categoryId)) {
      return Response.json({ success: false, message: "A valid category id is required." }, { status: 400 });
    }

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      return Response.json({ success: false, message: "Category not found." }, { status: 404 });
    }
    await recordAdminAudit(admin, request, "CATEGORY_DELETED", "Category", categoryId, { name: category.name });

    return Response.json({ success: true, message: "Category deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/categories failed:", error);
    return Response.json({ success: false, message: "Could not delete category." }, { status: 500 });
  }
}
