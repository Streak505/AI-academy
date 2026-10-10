import { NextResponse } from "next/server";
import { User } from "@/models/User";
import { connectDB } from "@/lib/db";
import { hashToken } from "@/lib/auth";

async function completeVerification(token: string) {
  if (!token) {
    return { status: 400, payload: { success: false, message: "Verification token is required." } };
  }

  await connectDB();
  const user = await User.findOne({
    verificationTokenHash: hashToken(token),
    verificationTokenExpiresAt: { $gt: new Date() },
  }).select("+verificationTokenHash");

  if (!user) {
    return { status: 400, payload: { success: false, message: "This verification link is invalid or has expired." } };
  }

  user.emailVerified = true;
  user.status = "ACTIVE";
  user.isActive = true;
  user.verificationTokenHash = "";
  user.verificationTokenExpiresAt = null;
  await user.save();

  return { status: 200, payload: { success: true, message: "Your email has been verified successfully." } };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  const result = await completeVerification(token);
  if (result.status !== 200) {
    return NextResponse.redirect(new URL(`/signin?verify=error`, url.origin));
  }

  return NextResponse.redirect(new URL(`/signin?verify=success`, url.origin));
}

export async function POST(request: Request) {
  const body = await request.json();
  const token = String(body?.token ?? "");
  const result = await completeVerification(token);
  return NextResponse.json(result.payload, { status: result.status });
}
