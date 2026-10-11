import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Payment } from "@/models/Payment";
import { isValidObjectId } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ success: false, message: "Administrator access is required." }, { status: 403 });
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ success: false, message: "Invalid payment id." }, { status: 400 });
    const token = process.env.BLOB_PRIVATE_READ_WRITE_TOKEN?.trim();
    if (!token) return NextResponse.json({ success: false, message: "Private payment proof storage is not configured." }, { status: 503 });
    await connectDB();
    const payment = await Payment.findById(id).select("proofUrl proofMimeType proofFilename").lean();
    if (!payment?.proofUrl) return NextResponse.json({ success: false, message: "Payment proof not found." }, { status: 404 });
    const blob = await get(payment.proofUrl, { access: "private", token, useCache: false });
    if (!blob || blob.statusCode !== 200) return NextResponse.json({ success: false, message: "Payment proof could not be retrieved." }, { status: 404 });
    return new NextResponse(blob.stream, {
      headers: {
        "Content-Type": payment.proofMimeType,
        "Content-Disposition": `inline; filename="${payment.proofFilename.replace(/["\\]/g, "_")}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET /api/admin/fees/payments/[id]/proof failed:", error);
    return NextResponse.json({ success: false, message: "Unable to open this payment proof." }, { status: 500 });
  }
}
