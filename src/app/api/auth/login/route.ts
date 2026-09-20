import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { setAuthCookies, signAccessToken, signRefreshToken, toSafeUser, verifyPassword, normalizeEmail } from "@/lib/auth";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body?.email || ""));
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email, isActive: true }).select("+passwordHash");
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json({ success: false, message: "This account is suspended." }, { status: 403 });
    }

    const role = user.role as "ADMIN" | "INSTRUCTOR" | "STUDENT";
    const accessToken = await signAccessToken({ sub: String(user._id), role, email: user.email });
    const refreshToken = await signRefreshToken({ sub: String(user._id), role, email: user.email });
    const response = NextResponse.json({
      success: true,
      role,
      user: toSafeUser(user),
      redirect: role === "ADMIN" ? "/admin/dashboard" : role === "INSTRUCTOR" ? "/instructor/dashboard" : "/student/dashboard",
    });

    setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ success: false, message: "Could not sign in." }, { status: 500 });
  }
}
