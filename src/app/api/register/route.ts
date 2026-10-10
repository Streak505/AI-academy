import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { generateSecureToken, hashPassword, hashToken, normalizeEmail, validatePassword } from "@/lib/auth";
import { User } from "@/models/User";
import { sendVerificationEmail } from "@/lib/email";

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
      return NextResponse.json({ success: false, message: "Password must be at least 8 characters long and include letters and numbers." }, { status: 400 });
    }

    await connectDB();
    const existing = await User.findOne({ email }).lean();
    if (existing) {
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
    await sendVerificationEmail({
      name: user.name,
      email: user.email,
      verificationUrl: `${appUrl}/api/auth/verify-email?token=${verificationToken}`,
    });

    return NextResponse.json({ success: true, message: "Account created successfully. Please verify your email to continue." }, { status: 201 });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ success: false, message: "Could not create account." }, { status: 500 });
  }
}
