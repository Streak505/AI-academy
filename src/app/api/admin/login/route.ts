import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { createAdminSessionToken, verifyPassword } from "@/lib/admin-auth";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email, role: "ADMIN", isActive: true }).select("+passwordHash");
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ success: false, message: "Invalid admin credentials." }, { status: 401 });
    }

    const cookieStore = await cookies();
    const token = createAdminSessionToken(email);
    cookieStore.set({
      name: "ai_admin_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({ success: true, message: "Admin login successful." });
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ success: false, message: "Could not sign in." }, { status: 500 });
  }
}
