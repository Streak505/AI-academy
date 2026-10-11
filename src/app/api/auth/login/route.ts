import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { setAuthCookies, signAccessToken, signRefreshToken, toSafeUser, verifyPassword, normalizeEmail } from "@/lib/auth";
import { User } from "@/models/User";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";
import { validateEmail } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    if (typeof input.website === "string" && input.website.trim()) return NextResponse.json({ success: true, data: { accepted: true } });
    const email = typeof input.email === "string" ? normalizeEmail(input.email) : "";
    const password = typeof input.password === "string" ? input.password : "";

    if (!validateEmail(email) || email.length > 254 || !password || password.length > 256) {
      return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateLimit = await checkRateLimit(`login:${email}`, 8, 15 * 60 * 1000);
    const ipRateLimit = await checkRateLimit(`login-ip:${ip}`, 30, 15 * 60 * 1000);
    if (!rateLimit.allowed || !ipRateLimit.allowed) {
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
    const accessToken = await signAccessToken({ sub: String(user._id), role, email: user.email, forcePasswordChange: user.forcePasswordChange });
    const refreshToken = await signRefreshToken({ sub: String(user._id), role, email: user.email });
    const response = NextResponse.json({
      success: true,
      role,
      user: toSafeUser(user),
      redirect: user.forcePasswordChange
        ? "/profile?forcePasswordChange=1"
        : role === "ADMIN" ? "/admin/dashboard" : role === "INSTRUCTOR" ? "/instructor/dashboard" : role === "PARENT" ? "/parent/dashboard" : "/student/dashboard",
    });

    setAuthCookies(response, accessToken, refreshToken);
    await Promise.all([
      clearRateLimit(`login:${email}`),
      clearRateLimit(`login-ip:${ip}`),
    ]);
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ success: false, message: "Could not sign in." }, { status: 500 });
  }
}
