import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { fail, ok, paginate, requireAuth } from "@/lib/api";
import { isValidObjectId, isValidString } from "@/lib/validations";
import { Notice } from "@/models/Notice";
import { Program } from "@/models/Program";
import { recordAdminAudit } from "@/lib/admin-audit";

const audiences = ["all", "students", "parents", "program"] as const;

function parseDate(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00+05:00`);
  const formatted = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return Number.isNaN(date.getTime()) || formatted !== value ? undefined : date;
}

function validateNotice(input: Record<string, unknown>) {
  const publishedAt = parseDate(input.publishedAt);
  const expiresAt = parseDate(input.expiresAt);
  if (!isValidString(input.title, 3, 180) || !isValidString(input.body, 3, 5000)
    || !audiences.includes(input.audience as (typeof audiences)[number])
    || typeof input.pinned !== "boolean" || publishedAt === undefined || expiresAt === undefined
    || (input.audience === "program" && !isValidObjectId(input.program))) return null;
  return { publishedAt: publishedAt ?? new Date(), expiresAt, program: input.audience === "program" ? input.program : null };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const { page, limit, skip } = paginate(new URL(request.url).searchParams);
    await connectDB();
    const [items, total] = await Promise.all([
      Notice.find().sort({ pinned: -1, publishedAt: -1 }).skip(skip).limit(limit).lean(),
      Notice.countDocuments(),
    ]);
    return ok({ items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    console.error("GET /api/admin/notices failed:", error);
    return fail("Unable to load notices.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    let input: Record<string, unknown>;
    try {
      input = await request.json();
    } catch {
      return fail("Invalid request body.", 400);
    }
    const dates = validateNotice(input);
    if (!dates) return fail("Notice details are invalid.", 400);
    await connectDB();
    if (input.audience === "program" && !await Program.exists({ _id: input.program })) return fail("Choose an existing program.", 400);
    const notice = await Notice.create({
      title: String(input.title).trim(),
      body: String(input.body).trim(),
      audience: input.audience,
      program: dates.program,
      pinned: input.pinned,
      publishedAt: dates.publishedAt,
      expiresAt: dates.expiresAt,
    });
    await recordAdminAudit(auth.user, request, "NOTICE_CREATED", "Notice", String(notice._id), { title: notice.title });
    return ok({ id: String(notice._id) }, 201);
  } catch (error) {
    console.error("POST /api/admin/notices failed:", error);
    return fail("Unable to create notice.", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    let input: Record<string, unknown>;
    try {
      input = await request.json();
    } catch {
      return fail("Invalid request body.", 400);
    }
    if (!isValidObjectId(input.id)) return fail("A valid notice id is required.", 400);
    const dates = validateNotice(input);
    if (!dates) return fail("Notice details are invalid.", 400);
    await connectDB();
    if (input.audience === "program" && !await Program.exists({ _id: input.program })) return fail("Choose an existing program.", 400);
    const notice = await Notice.findByIdAndUpdate(input.id, {
      title: String(input.title).trim(),
      body: String(input.body).trim(),
      audience: input.audience,
      program: dates.program,
      pinned: input.pinned,
      publishedAt: dates.publishedAt,
      expiresAt: dates.expiresAt,
    }, { new: true, runValidators: true });
    if (!notice) return fail("Notice not found.", 404);
    await recordAdminAudit(auth.user, request, "NOTICE_UPDATED", "Notice", String(notice._id), { title: notice.title });
    return ok({ id: String(notice._id) });
  } catch (error) {
    console.error("PUT /api/admin/notices failed:", error);
    return fail("Unable to update notice.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const id = new URL(request.url).searchParams.get("id") || "";
    if (!isValidObjectId(id)) return fail("A valid notice id is required.", 400);
    await connectDB();
    const notice = await Notice.findByIdAndDelete(id);
    if (!notice) return fail("Notice not found.", 404);
    await recordAdminAudit(auth.user, request, "NOTICE_DELETED", "Notice", id, { title: notice.title });
    return ok({ id });
  } catch (error) {
    console.error("DELETE /api/admin/notices failed:", error);
    return fail("Unable to delete notice.", 500);
  }
}
