import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { fail, ok, paginate, requireAuth } from "@/lib/api";
import { CsrInitiative } from "@/models/CsrInitiative";
import { isValidObjectId, isValidString } from "@/lib/validations";
import { recordAdminAudit } from "@/lib/admin-audit";

function validInitiative(body: Record<string, unknown>) {
  return isValidString(body.title, 3, 180)
    && isValidString(body.description, 5, 5000)
    && (body.icon === undefined || typeof body.icon === "string")
    && (body.imageUrl === undefined || (typeof body.imageUrl === "string" && body.imageUrl.length <= 2048))
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
      CsrInitiative.find().sort({ order: 1 }).skip(skip).limit(limit).lean(),
      CsrInitiative.countDocuments(),
    ]);
    return ok({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET /api/admin/csr failed:", error);
    return fail("Unable to load community initiatives.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const body = await request.json() as Record<string, unknown>;
    if (!validInitiative(body)) return fail("Initiative details are invalid.", 400);
    await connectDB();
    const initiative = await CsrInitiative.create({
      title: body.title, description: body.description, icon: body.icon ?? "", imageUrl: body.imageUrl ?? "",
      order: body.order ?? 0, isPublished: body.isPublished ?? true,
    });
    await recordAdminAudit(auth.user, request, "CSR_INITIATIVE_CREATED", "CsrInitiative", String(initiative._id), { title: initiative.title });
    return ok(initiative, 201);
  } catch (error) {
    console.error("POST /api/admin/csr failed:", error);
    return fail("Could not create community initiative.", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const body = await request.json() as Record<string, unknown>;
    const id = String(body.id ?? body._id ?? "");
    if (!isValidObjectId(id)) return fail("A valid initiative id is required.", 400);
    if (!validInitiative(body)) return fail("Initiative details are invalid.", 400);
    await connectDB();
    const updated = await CsrInitiative.findByIdAndUpdate(id, {
      title: body.title, description: body.description, icon: body.icon ?? "", imageUrl: body.imageUrl ?? "",
      order: body.order ?? 0, isPublished: body.isPublished ?? true,
    }, { new: true, runValidators: true });
    if (updated) await recordAdminAudit(auth.user, request, "CSR_INITIATIVE_UPDATED", "CsrInitiative", id, { title: updated.title });
    return updated ? ok(updated) : fail("Initiative not found.", 404);
  } catch (error) {
    console.error("PUT /api/admin/csr failed:", error);
    return fail("Could not update community initiative.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const id = new URL(request.url).searchParams.get("id") || "";
    if (!isValidObjectId(id)) return fail("A valid initiative id is required.", 400);
    await connectDB();
    const deleted = await CsrInitiative.findByIdAndDelete(id);
    if (deleted) await recordAdminAudit(auth.user, request, "CSR_INITIATIVE_DELETED", "CsrInitiative", id, { title: deleted.title });
    return deleted ? ok({ message: "Initiative deleted." }) : fail("Initiative not found.", 404);
  } catch (error) {
    console.error("DELETE /api/admin/csr failed:", error);
    return fail("Could not delete community initiative.", 500);
  }
}
