import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { hashPassword } from "@/lib/admin-auth";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const role = "STUDENT";

    if (!name || !email || password.length < 6) {
      return NextResponse.json({ success: false, message: "Name, valid email, and a password of at least 6 characters are required." }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ success: false, message: "An account with this email already exists." }, { status: 409 });
    }

    await User.create({ name, email, passwordHash: hashPassword(password), role });
    return NextResponse.json({ success: true, message: "Account created successfully." }, { status: 201 });
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ success: false, message: "Could not create account." }, { status: 500 });
  }
}
