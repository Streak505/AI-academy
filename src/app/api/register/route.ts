import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { hashPassword, normalizeEmail, validatePassword } from "@/lib/auth";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = normalizeEmail(String(body?.email || ""));
    const password = String(body?.password || "");
    const role = "STUDENT";

    if (!name || !email) {
      return NextResponse.json({ success: false, message: "Name and email are required." }, { status: 400 });
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ success: false, message: "Password must be at least 8 characters long and include letters and numbers." }, { status: 400 });
    }

    await connectDB();
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ success: false, message: "An account with this email already exists." }, { status: 409 });
    }

    await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      status: "ACTIVE",
      isActive: true,
    });

    return NextResponse.json({ success: true, message: "Account created successfully." }, { status: 201 });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ success: false, message: "Could not create account." }, { status: 500 });
  }
}
