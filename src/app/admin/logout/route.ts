import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearAdminSession } from "@/lib/admin-auth";
import { USER_COOKIE_NAME } from "@/lib/user-auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL(process.env.NODE_ENV === "production" ? "/E-learning/" : "/", request.url));
  response.cookies.set(clearAdminSession());
  response.cookies.set(USER_COOKIE_NAME, "", { expires: new Date(0), httpOnly: true, path: "/" });
  return response;
}
