import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { generateSecureToken, hashPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { AuditLog } from "@/models/AuditLog";
import { User } from "@/models/User";
import { isValidObjectId } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    const limit = checkRateLimit(`account-password-reset:${admin.id}`, 10, 60 * 60 * 1000);
    if (!limit.allowed) return NextResponse.json({ success: false, message: "Too many password resets. Try again later." }, { status: 429 });
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ success: false, message: "Invalid user id." }, { status: 400 });

    await connectDB();
    const user = await User.findById(id);
    if (!user || !["ADMIN", "INSTRUCTOR", "STUDENT", "PARENT"].includes(user.role)) {
      return NextResponse.json({ success: false, message: "A supported user account was not found." }, { status: 404 });
    }

    const temporaryPassword = generateSecureToken(12);
    user.passwordHash = await hashPassword(temporaryPassword);
    user.forcePasswordChange = true;
    user.lastPasswordChangeAt = new Date();
    await user.save();
    await AuditLog.create({
      actorId: admin.id,
      actorEmail: admin.email,
      action: "USER_PASSWORD_RESET",
      targetResource: "User",
      targetId: user._id,
      metadata: { role: user.role, email: user.email },
    });

    return NextResponse.json({
      success: true,
      data: { userId: String(user._id), name: user.name, role: user.role, email: user.email, temporaryPassword },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("POST /api/admin/users/[id]/reset-password failed:", error);
    return NextResponse.json({ success: false, message: "Unable to reset this account password." }, { status: 500 });
  }
}
