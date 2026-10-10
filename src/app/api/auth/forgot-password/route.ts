import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { generateSecureToken, hashToken, normalizeEmail } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body?.email ?? ""));

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required." }, { status: 400 });
    }

    const rateLimit = checkRateLimit(`forgot-password:${email}`, 3, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: "Too many password reset requests. Please wait a bit and try again." }, { status: 429 });
    }

    await connectDB();
    const user = await User.findOne({ email }).select("+resetTokenHash");
    if (!user) {
      return NextResponse.json({ success: true, message: "If an account exists for this email, a password reset link has been sent." });
    }

    const resetToken = generateSecureToken(32);
    user.resetTokenHash = hashToken(resetToken);
    user.resetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendPasswordResetEmail({ name: user.name, email: user.email, resetUrl: `${appUrl}/reset-password?token=${resetToken}` });

    return NextResponse.json({ success: true, message: "If an account exists for this email, a password reset link has been sent." });
  } catch (error) {
    console.error("Forgot password failed:", error);
    return NextResponse.json({ success: false, message: "Could not process password reset request." }, { status: 500 });
  }
}
