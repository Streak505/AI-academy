import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  for (const cookie of clearAuthCookies()) {
    response.cookies.set(cookie.name, "", cookie);
  }
  return response;
}
