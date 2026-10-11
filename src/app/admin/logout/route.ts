import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });
  for (const cookie of clearAuthCookies()) response.cookies.set({ ...cookie, value: "" });
  return response;
}
