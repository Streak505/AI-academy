import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { normalizeEmail, setAuthCookies, signAccessToken, signRefreshToken, toSafeUser, verifyPassword } from "@/lib/auth";
import { User } from "@/models/User";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    const email = normalizeEmail(String(body?.email || ""));
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
    }

    const rateLimit = checkRateLimit(`admin-login:${email}`, 5, 15 * 60 * 1000);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipRateLimit = checkRateLimit(`admin-login-ip:${ip}`, 10, 15 * 60 * 1000);
    if (!rateLimit.allowed || !ipRateLimit.allowed) {
      return NextResponse.json({ success: false, message: "Too many admin login attempts. Please wait a moment and try again." }, { status: 429 });
    }

    await connectDB();
    const user = await User.findOne({ email, role: "ADMIN" }).select("+passwordHash +adminLoginFailures +adminLoginWindowStartedAt +adminLockedUntil");
    const now = new Date();
    if (user?.adminLockedUntil && user.adminLockedUntil > now) {
      return NextResponse.json({ success: false, message: "Admin account is temporarily locked after repeated sign-in failures." }, { status: 429 });
    }
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      if (user) {
        const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
        if (!user.adminLoginWindowStartedAt || user.adminLoginWindowStartedAt < windowStart) {
          user.adminLoginFailures = 1;
          user.adminLoginWindowStartedAt = now;
        } else {
          user.adminLoginFailures += 1;
        }
        if (user.adminLoginFailures >= 5) user.adminLockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
        await user.save();
      }
      return NextResponse.json({ success: false, message: "Invalid admin credentials." }, { status: 401 });
    }

    if (user.isActive === false || ["DISABLED", "SUSPENDED"].includes(user.status) || !user.emailVerified) {
      return NextResponse.json({ success: false, message: "Admin account is not active." }, { status: 403 });
    }

    user.adminLoginFailures = 0;
    user.adminLoginWindowStartedAt = null;
    user.adminLockedUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = await signAccessToken({
      sub: String(user._id),
      role: "ADMIN",
      email: user.email,
      forcePasswordChange: user.forcePasswordChange,
    });
    const refreshToken = await signRefreshToken({ sub: String(user._id), role: "ADMIN", email: user.email });
    const response = NextResponse.json({
      success: true,
      message: "Admin login successful.",
      user: toSafeUser(user),
      redirect: user.forcePasswordChange ? "/profile?forcePasswordChange=1" : "/admin/dashboard",
    });
    setAuthCookies(response, accessToken, refreshToken);
    clearRateLimit(`admin-login:${email}`);
    clearRateLimit(`admin-login-ip:${ip}`);
    return response;
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ success: false, message: "Could not sign in." }, { status: 500 });
  }
}
