import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectDB } from "@/lib/db";
import { AUTH_COOKIE_NAME, ADMIN_COOKIE_NAME, REFRESH_COOKIE_NAME, Role, toSafeUser, verifyAccessToken } from "@/lib/auth";

export const USER_COOKIE_NAME = AUTH_COOKIE_NAME;

export async function getCurrentUserSession() {
  return getCurrentUser();
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token);
    if (!payload?.sub) return null;

    await connectDB();
    const user = await User.findById(payload.sub).lean();
    if (!user || user.isActive === false || user.status === "SUSPENDED") return null;
    return toSafeUser(user);
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required.");
  return user;
}

export async function requireRole(role: Role | Role[]) {
  const user = await getCurrentUser();
  const roles = Array.isArray(role) ? role : [role];
  if (!user || !roles.includes(user.role as Role)) {
    throw new Error("Forbidden.");
  }
  return user;
}

export async function requireAnyRole(roles: Role[]) {
  return requireRole(roles);
}

export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  const cookieOptions = {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  response.cookies.set(AUTH_COOKIE_NAME, accessToken, { ...cookieOptions, maxAge: 60 * 15 });
  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
  return response;
}

export function clearAuthCookies() {
  const cookieOptions = {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  return [
    { name: AUTH_COOKIE_NAME, ...cookieOptions },
    { name: REFRESH_COOKIE_NAME, ...cookieOptions },
    { name: ADMIN_COOKIE_NAME, ...cookieOptions },
  ];
}

export async function setUserSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 15,
  });
}

export type SessionUser = Awaited<ReturnType<typeof getCurrentUserSession>>;
