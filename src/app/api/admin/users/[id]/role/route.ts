import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { USER_ROLES } from "@/models/User";

const allowedRoles = USER_ROLES;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    const { id } = await params;
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    const requestedRole = String(body?.role ?? "");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid user ID." }, { status: 400 });
    }

    if (!allowedRoles.includes(requestedRole as (typeof allowedRoles)[number])) {
      return NextResponse.json({ success: false, message: "Invalid role supplied." }, { status: 400 });
    }

    await connectDB();
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }
    if (String(targetUser._id) === admin.id) {
      return NextResponse.json({ success: false, message: "You cannot change your own administrator role." }, { status: 409 });
    }

    const previousRole = targetUser.role;
    targetUser.role = requestedRole as (typeof allowedRoles)[number];
    if (targetUser.emailVerified && targetUser.status !== "SUSPENDED" && targetUser.status !== "DISABLED") {
      targetUser.status = "ACTIVE";
    }
    await targetUser.save();

    await AuditLog.create({
      action: "ROLE_UPDATED",
      actorId: admin.id,
      actorEmail: admin.email,
      targetResource: "User",
      targetId: targetUser._id,
      metadata: { previousRole, newRole: requestedRole },
    });

    return NextResponse.json({ success: true, message: "User role updated successfully.", user: { id: String(targetUser._id), role: targetUser.role } });
  } catch (error) {
    console.error("Admin role update failed:", error);
    return NextResponse.json({ success: false, message: "Could not update user role." }, { status: 500 });
  }
}
