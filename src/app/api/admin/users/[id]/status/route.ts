import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const status = String(body?.status ?? "");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid user ID." }, { status: 400 });
    }

    if (!(["ACTIVE", "SUSPENDED", "DISABLED"] as const).includes(status as "ACTIVE" | "SUSPENDED" | "DISABLED")) {
      return NextResponse.json({ success: false, message: "Invalid account status." }, { status: 400 });
    }

    await connectDB();
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const previousStatus = targetUser.status;
    targetUser.status = status as "ACTIVE" | "SUSPENDED" | "DISABLED";
    targetUser.isActive = status === "ACTIVE";
    await targetUser.save();

    await AuditLog.create({
      action: "ACCOUNT_STATUS_UPDATED",
      actorEmail: (await requireAdmin()).email,
      targetResource: "User",
      targetId: targetUser._id,
      metadata: { previousStatus, newStatus: status },
    });

    return NextResponse.json({ success: true, message: "Account status updated.", user: { id: String(targetUser._id), status: targetUser.status } });
  } catch (error) {
    console.error("Admin status update failed:", error);
    return NextResponse.json({ success: false, message: "Could not update account status." }, { status: 500 });
  }
}
