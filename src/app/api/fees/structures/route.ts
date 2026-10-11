import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { feeStructureSchema } from "@/lib/validations";
import { FeeStructure } from "@/models/FeeStructure";
import { Program } from "@/models/Program";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ success: false, message: "Administrator access is required." }, { status: 403 });
    await connectDB();
    const structures = await FeeStructure.find().populate("program", "title level").sort({ effectiveFrom: -1 }).lean();
    return NextResponse.json({ success: true, data: structures });
  } catch (error) {
    console.error("GET /api/fees/structures failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load fee structures." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (admin.role !== "ADMIN") return NextResponse.json({ success: false, message: "Administrator access is required." }, { status: 403 });
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    const parsed = feeStructureSchema.safeParse(input);
    if (!parsed.success) return NextResponse.json({ success: false, message: "Enter valid fee structure details using whole PKR amounts." }, { status: 400 });
    await connectDB();
    if (!await Program.exists({ _id: parsed.data.program })) {
      return NextResponse.json({ success: false, message: "Program not found." }, { status: 404 });
    }
    const structure = await FeeStructure.create({
      ...parsed.data,
      effectiveFrom: new Date(`${parsed.data.effectiveFrom}T00:00:00.000Z`),
      createdBy: admin.id,
    });
    return NextResponse.json({ success: true, data: structure }, { status: 201 });
  } catch (error) {
    console.error("POST /api/fees/structures failed:", error);
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ success: false, message: "A fee structure already exists for this program and effective date." }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "Unable to save this fee structure." }, { status: 500 });
  }
}
