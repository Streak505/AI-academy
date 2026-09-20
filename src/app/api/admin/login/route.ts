import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { normalizeEmail, setAuthCookies, signAccessToken, signRefreshToken, toSafeUser, verifyPassword } from "@/lib/auth";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body?.email || ""));
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email, role: "ADMIN", isActive: true, status: { $ne: "SUSPENDED" } }).select("+passwordHash");
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ success: false, message: "Invalid admin credentials." }, { status: 401 });
    }

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
