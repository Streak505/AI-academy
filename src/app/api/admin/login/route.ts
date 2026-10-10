import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { normalizeEmail, setAuthCookies, signAccessToken, signRefreshToken, toSafeUser, verifyPassword } from "@/lib/auth";
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

    const rateLimit = checkRateLimit(`admin-login:${email}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: "Too many admin login attempts. Please wait a moment and try again." }, { status: 429 });
    }

    await connectDB();
    const user = await User.findOne({ email, role: "ADMIN", isActive: true, status: { $ne: "SUSPENDED" } }).select("+passwordHash");
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ success: false, message: "Invalid admin credentials." }, { status: 401 });
    }

    if (user.status === "DISABLED" || !user.emailVerified) {
      return NextResponse.json({ success: false, message: "Admin account is not active." }, { status: 403 });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = await signAccessToken({ sub: String(user._id), role: "ADMIN", email: user.email });
    const refreshToken = await signRefreshToken({ sub: String(user._id), role: "ADMIN", email: user.email });
    const response = NextResponse.json({ success: true, message: "Admin login successful.", user: toSafeUser(user) });
    setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ success: false, message: "Could not sign in." }, { status: 500 });
  }
}
