import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAccessToken } from "@/lib/auth";

const publicPaths = [
  "/",
  "/signin",
  "/signup",
  "/admin/login",
  "/logout",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/google",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/test-db",
];

function isPublicPath(pathname: string) {
  return publicPaths.some((publicPath) => pathname === publicPath || pathname.startsWith("/api/auth/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/admin")) return NextResponse.redirect(new URL("/admin/login", request.url));
    if (pathname.startsWith("/student") || pathname.startsWith("/instructor")) return NextResponse.redirect(new URL("/signin", request.url));
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    if (pathname.startsWith("/admin")) return NextResponse.redirect(new URL("/admin/login", request.url));
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (pathname.startsWith("/admin") && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/instructor") && payload.role !== "INSTRUCTOR" && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/student") && payload.role !== "STUDENT" && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/admin/:path*", "/student/:path*", "/instructor/:path*", "/profile/:path*", "/settings/:path*"],
};
