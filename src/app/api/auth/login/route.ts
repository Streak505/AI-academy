import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { createAdminSessionToken, verifyPassword } from "@/lib/admin-auth";
import { createUserSession, setUserSession } from "@/lib/user-auth";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });

    await connectToDatabase();
    const user = await User.findOne({ email, isActive: true }).select("+passwordHash");
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
    }

    const role = user.role as "ADMIN" | "INSTRUCTOR" | "STUDENT";
    if (role === "ADMIN") {
      cookieStore.set({
        name: "ai_admin_session",
        value: createAdminSessionToken(email),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return NextResponse.json({ success: true, role, redirect: "/admin/dashboard" });
    }

    await setUserSession(createUserSession({ id: String(user._id), email: user.email, name: user.name, role }));
    return NextResponse.json({ success: true, role, redirect: role === "INSTRUCTOR" ? "/instructor/dashboard" : "/student/dashboard" });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ success: false, message: "Could not sign in." }, { status: 500 });
  }
}
