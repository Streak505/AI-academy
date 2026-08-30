import crypto from "crypto";
import { cookies } from "next/headers";

export const USER_COOKIE_NAME = "ai_academy_session";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET environment variable.");
  return secret;
}

export function createUserSession(user: { id: string; email: string; name: string; role: SessionUser["role"] }) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString("base64url");
  const secret = getSessionSecret();
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyUserSession(token?: string): SessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return null;
  }
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser;
    return session.exp > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return verifyUserSession(cookieStore.get(USER_COOKIE_NAME)?.value);
}

export async function setUserSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: USER_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
