import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectDB } from "@/lib/db";
import { setAuthCookies, signAccessToken, signRefreshToken, toSafeUser, normalizeEmail } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body?.email ?? ""));
    const providerAccountId = String(body?.providerAccountId ?? "");
    const name = String(body?.name ?? "").trim();
    const image = String(body?.image ?? "").trim();

    if (!email || !providerAccountId) {
      return NextResponse.json({ success: false, message: "Google account information is incomplete." }, { status: 400 });
    }

    await connectDB();
    let user = await User.findOne({
      $or: [{ email }, { authProvider: "google", providerAccountId }],
    }).lean();

    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        passwordHash: "",
        profileImage: image,
        role: "STUDENT",
        status: "ACTIVE",
        emailVerified: true,
        authProvider: "google",
        providerAccountId,
        isActive: true,
      });
    } else {
      const updates: Record<string, unknown> = {
        emailVerified: true,
        status: user.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
        authProvider: "google",
        providerAccountId,
        isActive: true,
      };

      if (image && !user.profileImage) {
        updates.profileImage = image;
      }

      if (name && !user.name) {
        updates.name = name;
      }

      if (user.email !== email) {
        updates.email = email;
      }

      await User.findByIdAndUpdate(user._id, updates, { new: true });
      user = await User.findById(user._id).lean();
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Unable to sign in with Google." }, { status: 500 });
    }

    const accessToken = await signAccessToken({ sub: String(user._id), role: user.role, email: user.email });
    const refreshToken = await signRefreshToken({ sub: String(user._id), role: user.role, email: user.email });
    const response = NextResponse.json({ success: true, user: toSafeUser(user), redirect: user.role === "ADMIN" ? "/admin/dashboard" : user.role === "INSTRUCTOR" ? "/instructor/dashboard" : user.role === "PARENT" ? "/parent/dashboard" : "/student/dashboard" });
    setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (error) {
    console.error("Google login failed:", error);
    return NextResponse.json({ success: false, message: "Could not continue with Google." }, { status: 500 });
  }
}
