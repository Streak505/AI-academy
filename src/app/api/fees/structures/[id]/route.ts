import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isValidObjectId, feeStructureSchema } from "@/lib/validations";
import { FeeStructure } from "@/models/FeeStructure";
import { Program } from "@/models/Program";
import { getCurrentUser } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ success: false, message: "Administrator access is required." }, { status: 403 });
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ success: false, message: "Invalid fee structure id." }, { status: 400 });
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    const parsed = feeStructureSchema.safeParse(input);
    if (!parsed.success) return NextResponse.json({ success: false, message: "Enter valid fee structure details using whole PKR amounts." }, { status: 400 });
    await connectDB();
    if (!await Program.exists({ _id: parsed.data.program })) return NextResponse.json({ success: false, message: "Program not found." }, { status: 404 });
    const updated = await FeeStructure.findByIdAndUpdate(id, {
      ...parsed.data,
      effectiveFrom: new Date(`${parsed.data.effectiveFrom}T00:00:00.000Z`),
    }, { new: true, runValidators: true });
    return updated
      ? NextResponse.json({ success: true, data: updated })
      : NextResponse.json({ success: false, message: "Fee structure not found." }, { status: 404 });
  } catch (error) {
    console.error("PUT /api/fees/structures/[id] failed:", error);
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ success: false, message: "A fee structure already exists for this program and effective date." }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "Unable to update this fee structure." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ success: false, message: "Administrator access is required." }, { status: 403 });
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ success: false, message: "Invalid fee structure id." }, { status: 400 });
    await connectDB();
    const deleted = await FeeStructure.findByIdAndDelete(id);
    return deleted
      ? NextResponse.json({ success: true, data: { id } })
      : NextResponse.json({ success: false, message: "Fee structure not found." }, { status: 404 });
  } catch (error) {
    console.error("DELETE /api/fees/structures/[id] failed:", error);
    return NextResponse.json({ success: false, message: "Unable to delete this fee structure." }, { status: 500 });
  }
}
