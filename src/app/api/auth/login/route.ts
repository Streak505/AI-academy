import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { setAuthCookies, signAccessToken, signRefreshToken, toSafeUser, verifyPassword, normalizeEmail } from "@/lib/auth";
import { User } from "@/models/User";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body?.email || ""));
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
    }

    const rateLimit = checkRateLimit(`login:${email}`, 8, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: "Too many login attempts. Please wait a moment and try again." }, { status: 429 });
    }

    await connectDB();
    const user = await User.findOne({ email, isActive: true }).select("+passwordHash");
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
    }

    if (user.status === "SUSPENDED" || user.status === "DISABLED") {
      return NextResponse.json({ success: false, message: "This account is suspended or disabled." }, { status: 403 });
    }

    if (!user.emailVerified && user.authProvider === "local") {
      return NextResponse.json({ success: false, message: "Please verify your email before logging in." }, { status: 403 });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const role = user.role as "ADMIN" | "INSTRUCTOR" | "STUDENT" | "PARENT" | "MODERATOR";
    const accessToken = await signAccessToken({ sub: String(user._id), role, email: user.email });
    const refreshToken = await signRefreshToken({ sub: String(user._id), role, email: user.email });
    const response = NextResponse.json({
      success: true,
      role,
      user: toSafeUser(user),
      redirect: role === "ADMIN" ? "/admin/dashboard" : role === "INSTRUCTOR" ? "/instructor/dashboard" : role === "PARENT" ? "/parent/dashboard" : "/student/dashboard",
    });

    setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ success: false, message: "Could not sign in." }, { status: 500 });
  }
}
