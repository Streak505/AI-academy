import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/user-auth";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const user = await getCurrentUser();
  if (user) {
    return NextResponse.json({ authenticated: true, user });
  }

  const adminEmail = verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  if (adminEmail) {
    return NextResponse.json({
      authenticated: true,
      user: { email: adminEmail, name: "Academy Admin", role: "ADMIN" },
    });
  }

  return NextResponse.json({ authenticated: false, user: null });
}
