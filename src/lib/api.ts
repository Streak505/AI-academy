import { NextResponse } from "next/server";
import { Role, getCurrentUser } from "@/lib/auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function requireAuth(roles: Role[] = []) {
  const user = await getCurrentUser();
  if (!user) return { authorized: false as const, response: fail("Authentication is required.", 401) };
  if (roles.length > 0 && !roles.includes(user.role)) {
    return { authorized: false as const, response: fail("You do not have permission to perform this action.", 403) };
  }
  return { authorized: true as const, user };
}

export function paginate(searchParams: URLSearchParams) {
  const requestedPage = Number(searchParams.get("page") || 1);
  const requestedLimit = Number(searchParams.get("limit") || 24);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 24;
  return { page, limit, skip: (page - 1) * limit };
}
