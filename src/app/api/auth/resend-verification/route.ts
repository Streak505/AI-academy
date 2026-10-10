import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { generateSecureToken, hashToken, normalizeEmail } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body?.email ?? ""));

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required." }, { status: 400 });
    }

    const rateLimit = checkRateLimit(`resend-verification:${email}`, 3, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: "Too many verification requests. Please wait a bit and try again." }, { status: 429 });
    }

    await connectDB();
    const user = await User.findOne({ email }).select("+verificationTokenHash");
    if (!user) {
      return NextResponse.json({ success: true, message: "If an account exists for this email, a verification link has been sent." });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: "Your email is already verified." });
    }

    const verificationToken = generateSecureToken(32);
    user.verificationTokenHash = hashToken(verificationToken);
    user.verificationTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    user.status = "PENDING_VERIFICATION";
    await user.save();

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendVerificationEmail({ name: user.name, email: user.email, verificationUrl: `${appUrl}/api/auth/verify-email?token=${verificationToken}` });

    return NextResponse.json({ success: true, message: "If an account exists for this email, a verification link has been sent." });
  } catch (error) {
    console.error("Resend verification failed:", error);
    return NextResponse.json({ success: false, message: "Could not resend verification email." }, { status: 500 });
  }
}
