import { NextResponse } from "next/server";
import { USER_COOKIE_NAME } from "@/lib/user-auth";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL(process.env.NODE_ENV === "production" ? "/E-learning/" : "/", request.url));
  const cookieOptions = { expires: new Date(0), httpOnly: true, path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
  response.cookies.set(USER_COOKIE_NAME, "", cookieOptions);
  response.cookies.set(ADMIN_COOKIE_NAME, "", cookieOptions);
  return response;
}
