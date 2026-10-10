import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { generateSecureToken, hashPassword, hashToken, normalizeEmail, validatePassword } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const email = normalizeEmail(String(body?.email ?? ""));
    const password = String(body?.password ?? "");

    if (!name || !email) {
      return NextResponse.json({ success: false, message: "Name and email are required." }, { status: 400 });
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ success: false, message: "Password must be at least 8 characters and include letters and numbers." }, { status: 400 });
    }

    const rateLimit = checkRateLimit(`register:${email}`, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: "Too many sign up attempts. Please wait a moment and try again." }, { status: 429 });
    }

    await connectDB();
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return NextResponse.json({ success: false, message: "An account with this email already exists." }, { status: 409 });
    }

    const verificationToken = generateSecureToken(32);
    const user = await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "STUDENT",
      status: "PENDING_VERIFICATION",
      emailVerified: false,
      authProvider: "local",
      isActive: true,
      verificationTokenHash: hashToken(verificationToken),
      verificationTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${verificationToken}`;
    await sendVerificationEmail({ name: user.name, email: user.email, verificationUrl });

    return NextResponse.json({ success: true, message: "Account created successfully. Please verify your email to continue." }, { status: 201 });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ success: false, message: "Could not create account." }, { status: 500 });
  }
}
