import { NextResponse } from "next/server";
import { USER_COOKIE_NAME } from "@/lib/user-auth";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(USER_COOKIE_NAME, "", { expires: new Date(0), path: "/" });
  response.cookies.set(ADMIN_COOKIE_NAME, "", { expires: new Date(0), path: "/" });
  return response;
}
