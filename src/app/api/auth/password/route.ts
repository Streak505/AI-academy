import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { User } from "@/models/User";
import { verifyPassword, hashPassword } from "@/lib/admin-auth";
import { getAdminEmail } from "@/lib/admin-auth";

export async function PUT(request: Request) {
  try {
    const session = await getCurrentUser();
    const adminEmail = session ? null : await getAdminEmail();
    if (!session && !adminEmail) return NextResponse.json({ success: false, message: "Please sign in first." }, { status: 401 });
    const body = await request.json();
    const currentPassword = String(body?.currentPassword || "");
    const newPassword = String(body?.newPassword || "");
    if (newPassword.length < 8) return NextResponse.json({ success: false, message: "New password must be at least 8 characters." }, { status: 400 });
    await connectToDatabase();
    const user = await User.findOne(session ? { _id: session.id } : { email: adminEmail }).select("+passwordHash");
    if (!user || !verifyPassword(currentPassword, user.passwordHash)) return NextResponse.json({ success: false, message: "Current password is incorrect." }, { status: 400 });
    user.passwordHash = hashPassword(newPassword);
    await user.save();
    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Password update failed:", error);
    return NextResponse.json({ success: false, message: "Could not update password." }, { status: 500 });
  }
}
