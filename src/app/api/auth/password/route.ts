import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/user-auth";
import { User } from "@/models/User";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/auth";
import { setAuthCookies, signAccessToken, signRefreshToken } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ success: false, message: "Please sign in first." }, { status: 401 });
    const body = await request.json();
    const currentPassword = String(body?.currentPassword || "");
    const newPassword = String(body?.newPassword || "");
    if (!validatePassword(newPassword)) return NextResponse.json({ success: false, message: "New password must be at least 8 characters and include a letter and number." }, { status: 400 });
    await connectToDatabase();
    const user = await User.findById(session.id).select("+passwordHash");
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) return NextResponse.json({ success: false, message: "Current password is incorrect." }, { status: 400 });
    user.passwordHash = await hashPassword(newPassword);
    user.forcePasswordChange = false;
    await user.save();
    const accessToken = await signAccessToken({ sub: String(user._id), role: user.role, email: user.email, forcePasswordChange: false });
    const refreshToken = await signRefreshToken({ sub: String(user._id), role: user.role, email: user.email });
    return setAuthCookies(NextResponse.json({ success: true, message: "Password updated successfully." }), accessToken, refreshToken);
  } catch (error) {
    console.error("Password update failed:", error);
    return NextResponse.json({ success: false, message: "Could not update password." }, { status: 500 });
  }
}
