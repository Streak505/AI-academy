import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import jwt, { JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectDB } from "@/lib/db";

export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT" | "MODERATOR";

export const AUTH_COOKIE_NAME = "ai_academy_auth";
export const ADMIN_COOKIE_NAME = "ai_admin_session";
export const REFRESH_COOKIE_NAME = "ai_academy_refresh";

function getEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

export function normalizeEmail(value: string) {
  return String(value ?? "").trim().toLowerCase();
}

export function validatePassword(password: string) {
  if (typeof password !== "string") return false;
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

export function generateSecureToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  if (!passwordHash || !password) return false;
  return bcrypt.compare(password, passwordHash);
}

type TokenPayload = {
  sub: string;
  role: Role;
  email?: string;
  jti?: string;
  type: "access" | "refresh";
};

export async function signAccessToken({ sub, role, email }: { sub: string; role: Role; email?: string }) {
  return jwt.sign({ sub, role, email, type: "access", jti: generateSecureToken(16) }, getEnv("JWT_SECRET"), {
    expiresIn: "15m",
    issuer: "aiacademy",
    algorithm: "HS256",
  });
}

export async function signRefreshToken({ sub, role, email }: { sub: string; role: Role; email?: string }) {
  return jwt.sign({ sub, role, email, type: "refresh", jti: generateSecureToken(16) }, getEnv("JWT_REFRESH_SECRET"), {
    expiresIn: "7d",
    issuer: "aiacademy",
    algorithm: "HS256",
  });
}

async function verifyToken(token: string, expectedType: "access" | "refresh", secretName: "JWT_SECRET" | "JWT_REFRESH_SECRET") {
  try {
    const decoded = jwt.verify(token, getEnv(secretName), {
      algorithms: ["HS256"],
      issuer: "aiacademy",
    }) as JwtPayload & TokenPayload;

    if (!decoded || decoded.type !== expectedType || !decoded.sub) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export async function verifyAccessToken(token: string) {
  return verifyToken(token, "access", "JWT_SECRET");
}

export async function verifyRefreshToken(token: string) {
  return verifyToken(token, "refresh", "JWT_REFRESH_SECRET");
}

export function toSafeUser(user: any) {
  return {
    id: String(user?._id ?? user?.id ?? ""),
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: (user?.role as Role) ?? "STUDENT",
    avatar: user?.avatar ?? user?.profileImage ?? "",
    status: user?.status ?? (user?.isActive === false ? "SUSPENDED" : "ACTIVE"),
    emailVerified: Boolean(user?.emailVerified),
    authProvider: user?.authProvider ?? "local",
    createdAt: user?.createdAt ? new Date(user.createdAt).toISOString() : undefined,
    updatedAt: user?.updatedAt ? new Date(user.updatedAt).toISOString() : undefined,
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyAccessToken(token);
  if (!payload?.sub) return null;

  await connectDB();
  const user = await User.findById(payload.sub).lean();
  if (!user || user.isActive === false || user.status === "SUSPENDED" || user.status === "DISABLED") {
    return null;
  }

  return {
    id: String(user._id),
    email: user.email ?? "",
    role: (user.role as Role) ?? "STUDENT",
    name: user.name ?? "",
    status: user.status ?? "ACTIVE",
    emailVerified: Boolean(user.emailVerified),
    authProvider: user.authProvider ?? "local",
  };
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

export async function requireAdmin() {
  return requireRole("ADMIN");
}

export async function requireInstructor() {
  return requireRole(["INSTRUCTOR", "ADMIN"]);
}

export async function requireStudent() {
  return requireRole(["STUDENT", "INSTRUCTOR", "ADMIN", "MODERATOR"]);
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

export function getSafeRedirectPath(pathname: string | null | undefined) {
  if (!pathname) return "/";
  if (!pathname.startsWith("/")) return "/";
  const blocked = ["http://", "https://", "//", "javascript:"];
  if (blocked.some((prefix) => pathname.toLowerCase().startsWith(prefix))) return "/";
  return pathname;
}
