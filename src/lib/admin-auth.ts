import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "ai_admin_session";

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, storedHash] = passwordHash.split("$");
  if (algorithm !== "scrypt" || !salt || !storedHash) return false;

  const derivedHash = crypto.scryptSync(password, salt, 64);
  const expectedHash = Buffer.from(storedHash, "hex");
  return derivedHash.length === expectedHash.length && crypto.timingSafeEqual(derivedHash, expectedHash);
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET environment variable.");
  return secret;
}

export function createAdminSessionToken(email: string) {
  const secret = getSessionSecret();
  const payload = Buffer.from(
    JSON.stringify({
      email: email.toLowerCase(),
      exp: Date.now() + 1000 * 60 * 60 * 24,
    })
  ).toString("base64url");

  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return null;
  }
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  if (expectedSignature.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (!decoded?.email || Date.now() > decoded.exp) {
      return null;
    }

    return decoded.email as string;
  } catch {
    return null;
  }
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return Boolean(verifyAdminSessionToken(token));
}

export async function getAdminEmail() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function requireAdmin() {
  return getAdminEmail();
}

export async function requireAdminResponse() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
  }

  return null;
}

export function clearAdminSession() {
  return {
    name: ADMIN_COOKIE_NAME,
    value: "",
    expires: new Date(0),
    path: "/",
  };
}
