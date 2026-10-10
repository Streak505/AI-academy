import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { hashPassword, hashToken, validatePassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body?.token ?? "");
    const password = String(body?.password ?? "");

    if (!token || !password) {
      return NextResponse.json({ success: false, message: "Invalid reset request." }, { status: 400 });
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ success: false, message: "Password must be at least 8 characters and include letters and numbers." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({
      resetTokenHash: hashToken(token),
      resetTokenExpiresAt: { $gt: new Date() },
    }).select("+resetTokenHash +passwordHash");

    if (!user) {
      return NextResponse.json({ success: false, message: "This reset link is invalid or has expired." }, { status: 400 });
    }

    user.passwordHash = await hashPassword(password);
    user.resetTokenHash = "";
    user.resetTokenExpiresAt = null;
    user.lastPasswordChangeAt = new Date();
    await user.save();

    return NextResponse.json({ success: true, message: "Your password has been reset successfully." });
  } catch (error) {
    console.error("Password reset failed:", error);
    return NextResponse.json({ success: false, message: "Could not reset password." }, { status: 500 });
  }
}
