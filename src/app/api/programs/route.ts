import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { fail, ok, paginate } from "@/lib/api";
import { PROGRAM_GROUPS, Program } from "@/models/Program";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group");
    if (group && !PROGRAM_GROUPS.includes(group as (typeof PROGRAM_GROUPS)[number])) {
      return fail("Invalid program group.", 400);
    }

    const { page, limit, skip } = paginate(searchParams);
    await connectDB();
    const filter = { isPublished: true, ...(group ? { group } : {}) };
    const [programs, total] = await Promise.all([
      Program.find(filter).sort({ order: 1, title: 1 }).skip(skip).limit(limit).lean(),
      Program.countDocuments(filter),
    ]);
    return ok({ items: programs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET /api/programs failed:", error);
    return fail("Unable to load programs.", 500);
  }
}
