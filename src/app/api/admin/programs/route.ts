import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { fail, ok, paginate, requireAuth } from "@/lib/api";
import { PROGRAM_GROUPS, PROGRAM_MODES, Program } from "@/models/Program";
import { isValidObjectId, isValidString } from "@/lib/validations";

function validProgram(body: Record<string, unknown>) {
  return isValidString(body.title, 2, 160)
    && isValidString(body.slug, 2, 180)
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(body.slug))
    && PROGRAM_GROUPS.includes(body.group as (typeof PROGRAM_GROUPS)[number])
    && isValidString(body.description, 5, 5000)
    && Number.isSafeInteger(body.monthlyFee) && Number(body.monthlyFee) >= 0
    && Number.isSafeInteger(body.admissionFee) && Number(body.admissionFee) >= 0
    && (body.mode === undefined || PROGRAM_MODES.includes(body.mode as (typeof PROGRAM_MODES)[number]))
    && (body.features === undefined || (Array.isArray(body.features) && body.features.every((item) => typeof item === "string")))
    && (body.order === undefined || (Number.isSafeInteger(body.order) && Number(body.order) >= 0));
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = paginate(searchParams);
    await connectDB();
    const [items, total] = await Promise.all([
      Program.find().sort({ order: 1, title: 1 }).skip(skip).limit(limit).lean(),
      Program.countDocuments(),
    ]);
    return ok({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET /api/admin/programs failed:", error);
    return fail("Unable to load programs.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const body = await request.json() as Record<string, unknown>;
    if (!validProgram(body)) return fail("Program details are invalid.", 400);
    await connectDB();
    const program = await Program.create({
      title: body.title,
      slug: body.slug,
      group: body.group,
      level: typeof body.level === "string" ? body.level : "",
      description: body.description,
      features: body.features ?? [],
      duration: typeof body.duration === "string" ? body.duration : "",
      monthlyFee: body.monthlyFee,
      admissionFee: body.admissionFee,
      mode: body.mode ?? "Physical",
      isPublished: body.isPublished ?? true,
      order: body.order ?? 0,
    });
    return ok(program, 201);
  } catch (error) {
    console.error("POST /api/admin/programs failed:", error);
    return fail("Could not create program.", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const body = await request.json() as Record<string, unknown>;
    const id = String(body.id ?? body._id ?? "");
    if (!isValidObjectId(id)) return fail("A valid program id is required.", 400);
    if (!validProgram(body)) return fail("Program details are invalid.", 400);
    await connectDB();
    const updated = await Program.findByIdAndUpdate(id, {
      title: body.title, slug: body.slug, group: body.group, level: body.level ?? "",
      description: body.description, features: body.features ?? [], duration: body.duration ?? "",
      monthlyFee: body.monthlyFee, admissionFee: body.admissionFee, mode: body.mode ?? "Physical",
      isPublished: body.isPublished ?? true, order: body.order ?? 0,
    }, { new: true, runValidators: true });
    return updated ? ok(updated) : fail("Program not found.", 404);
  } catch (error) {
    console.error("PUT /api/admin/programs failed:", error);
    return fail("Could not update program.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const id = new URL(request.url).searchParams.get("id") || "";
    if (!isValidObjectId(id)) return fail("A valid program id is required.", 400);
    await connectDB();
    const deleted = await Program.findByIdAndDelete(id);
    return deleted ? ok({ message: "Program deleted." }) : fail("Program not found.", 404);
  } catch (error) {
    console.error("DELETE /api/admin/programs failed:", error);
    return fail("Could not delete program.", 500);
  }
}
