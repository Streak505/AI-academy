import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME = "ai_admin_session";

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
}

function decodeHex(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function hasValidAdminSession(request: NextRequest) {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!secret || !token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !/^[0-9a-f]+$/i.test(signature)) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeHex(signature),
      new TextEncoder().encode(payload)
    );
    if (!validSignature) return false;

    const session = JSON.parse(decodeBase64Url(payload)) as { email?: string; exp?: number };
    return Boolean(session.email && session.exp && Date.now() < session.exp);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/admin/login" || pathname === "/admin/logout") {
    return NextResponse.next();
  }

  if (!(await hasValidAdminSession(request))) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
