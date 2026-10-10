import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectDB } from "@/lib/db";
import { setAuthCookies, signAccessToken, signRefreshToken, toSafeUser, verifyRefreshToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const refreshToken = String(body?.refreshToken ?? "");

    if (!refreshToken) {
      return NextResponse.json({ success: false, message: "Refresh token is required." }, { status: 401 });
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload?.sub) {
      return NextResponse.json({ success: false, message: "Invalid refresh token." }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(payload.sub).lean();
    if (!user || user.isActive === false || user.status === "SUSPENDED" || user.status === "DISABLED") {
      return NextResponse.json({ success: false, message: "Session expired or invalid." }, { status: 401 });
    }

    const accessToken = await signAccessToken({ sub: String(user._id), role: user.role, email: user.email });
    const rotatedRefreshToken = await signRefreshToken({ sub: String(user._id), role: user.role, email: user.email });
    const response = NextResponse.json({ success: true, user: toSafeUser(user) });
    setAuthCookies(response, accessToken, rotatedRefreshToken);
    return response;
  } catch (error) {
    console.error("Refresh token failed:", error);
    return NextResponse.json({ success: false, message: "Could not refresh session." }, { status: 500 });
  }
}
