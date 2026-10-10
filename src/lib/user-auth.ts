import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, ADMIN_COOKIE_NAME, REFRESH_COOKIE_NAME, Role, clearAuthCookies, generateSecureToken, getCurrentUser, hashPassword, hashToken, requireAdmin, requireAuth, requireInstructor, requireRole, requireStudent, setAuthCookies, toSafeUser, validatePassword, verifyAccessToken, verifyPassword } from "@/lib/auth";

export const USER_COOKIE_NAME = AUTH_COOKIE_NAME;
export const USER_ROLES = ["ADMIN", "INSTRUCTOR", "STUDENT", "PARENT", "MODERATOR"] as const;

export async function getCurrentUserSession() {
  return getCurrentUser();
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

export async function requireAnyRole(roles: Role[]) {
  return requireRole(roles);
}

export type SessionUser = Awaited<ReturnType<typeof getCurrentUserSession>>;

export type { Role };

export {
  ADMIN_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  clearAuthCookies,
  generateSecureToken,
  getCurrentUser,
  hashPassword,
  hashToken,
  requireAdmin,
  requireAuth,
  requireInstructor,
  requireRole,
  requireStudent,
  setAuthCookies,
  toSafeUser,
  validatePassword,
  verifyAccessToken,
  verifyPassword,
};
