import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const allowedRoles = ["ADMIN", "INSTRUCTOR", "STUDENT", "MODERATOR"] as const;
const allowedStatuses = ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "DISABLED"] as const;

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const search = (url.searchParams.get("search") ?? "").trim();
    const role = url.searchParams.get("role") ?? "all";
    const status = url.searchParams.get("status") ?? "all";
    const sortBy = url.searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") ?? "desc";
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "20");

    await connectDB();
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role !== "all" && allowedRoles.includes(role as (typeof allowedRoles)[number])) {
      query.role = role;
    }

    if (status !== "all" && allowedStatuses.includes(status as (typeof allowedStatuses)[number])) {
      query.status = status;
    }

    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const skip = Math.max(0, (page - 1) * limit);
    const [users, total] = await Promise.all([
      User.find(query).sort(sort).skip(skip).limit(limit).select("-passwordHash").lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("Admin user listing failed:", error);
    return NextResponse.json({ success: false, message: "Unauthorized or not available." }, { status: 401 });
  }
}
