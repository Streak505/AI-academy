import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully." });
  for (const cookie of clearAuthCookies()) {
    response.cookies.set(cookie.name, "", cookie);
  }
  return response;
}
