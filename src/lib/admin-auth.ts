import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectDB } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { ADMIN_COOKIE_NAME, AUTH_COOKIE_NAME, clearAuthCookies, hashPassword, normalizeEmail, toSafeUser, verifyAccessToken, verifyPassword } from "@/lib/auth";

export { ADMIN_COOKIE_NAME, AUTH_COOKIE_NAME, clearAuthCookies, hashPassword, normalizeEmail, verifyPassword, verifyAccessToken, toSafeUser };

export async function isAdminAuthenticated() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

export async function getAdminEmail() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user.email : null;
}

export async function requireAdmin() {
  try {
    return await requireRole("ADMIN");
  } catch {
    return null;
  }
}

export async function requireAdminResponse() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
  }

  return null;
}

export async function getCurrentAdminUser() {
  const user = await requireAdmin();
  if (!user) return null;

  await connectDB();
  const dbUser = await User.findById(user.id).select("-passwordHash").lean();
  return dbUser ? toSafeUser(dbUser) : null;
}

export function clearAdminSession() {
  return {
    name: AUTH_COOKIE_NAME,
    value: "",
    expires: new Date(0),
    path: "/",
  };
}

export function createAdminSessionToken(email: string) {
  return email;
}
