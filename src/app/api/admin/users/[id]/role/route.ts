import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { USER_ROLES } from "@/models/User";

const allowedRoles = USER_ROLES;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
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

    const previousRole = targetUser.role;
    targetUser.role = requestedRole as (typeof allowedRoles)[number];
    if (targetUser.emailVerified && targetUser.status !== "SUSPENDED" && targetUser.status !== "DISABLED") {
      targetUser.status = "ACTIVE";
    }
    await targetUser.save();

    await AuditLog.create({
      action: "ROLE_UPDATED",
      actorEmail: (await requireAdmin()).email,
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
