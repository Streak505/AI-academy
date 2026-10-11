import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { hashPassword, generateSecureToken } from "@/lib/auth";
import { isValidString, validateEmail } from "@/lib/validations";
import { recordAdminAudit } from "@/lib/admin-audit";

const allowedStatuses = ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "DISABLED"] as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    const url = new URL(request.url);
    const search = (url.searchParams.get("search") ?? "").trim().slice(0, 120);
    const role = url.searchParams.get("role") ?? "all";
    const status = url.searchParams.get("status") ?? "all";
    const requestedPage = Number(url.searchParams.get("page") ?? "1");
    const requestedLimit = Number(url.searchParams.get("limit") ?? "20");
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 20;

    await connectDB();
    const query: Record<string, unknown> = {};

    if (search) {
      const match = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { name: match },
        { email: match },
      ];
    }

    if (role !== "all" && ["ADMIN", "INSTRUCTOR", "STUDENT", "PARENT"].includes(role)) {
      query.role = role;
    }

    if (status !== "all" && allowedStatuses.includes(status as (typeof allowedStatuses)[number])) {
      query.status = status;
    }

    const skip = Math.max(0, (page - 1) * limit);
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-passwordHash").lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch (error) {
    console.error("Admin user listing failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load user accounts." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    let input: Record<string, unknown>;
    try {
      input = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    if (!isValidString(input.name, 2, 120) || !validateEmail(input.email) || String(input.email).length > 254
      || !["ADMIN", "INSTRUCTOR"].includes(String(input.role))) {
      return NextResponse.json({ success: false, message: "Enter a valid name, email, and staff role." }, { status: 400 });
    }
    await connectDB();
    const temporaryPassword = generateSecureToken(12);
    const user = await User.create({
      name: String(input.name).trim(),
      email: String(input.email).trim().toLowerCase(),
      role: input.role,
      passwordHash: await hashPassword(temporaryPassword),
      status: "ACTIVE",
      isActive: true,
      emailVerified: true,
      forcePasswordChange: true,
    });
    await recordAdminAudit(admin, request, "STAFF_ACCOUNT_CREATED", "User", String(user._id), { role: user.role, email: user.email });
    return NextResponse.json({
      success: true,
      data: { id: String(user._id), name: user.name, email: user.email, role: user.role, temporaryPassword },
    }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("POST /api/admin/users failed:", error);
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ success: false, message: "An account with that email already exists." }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "Unable to create staff account." }, { status: 500 });
  }
}
