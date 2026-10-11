import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { connectDB } from "@/lib/db";
import { createChallanPdf, type ChallanPdfData } from "@/lib/fee-pdf";
import { FeeChallan } from "@/models/FeeChallan";
import { isValidObjectId, feeMonthSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";
import { Student } from "@/models/Student";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (user.role !== "ADMIN") return NextResponse.json({ success: false, message: "Administrator access is required." }, { status: 403 });
    const periodMonth = request.nextUrl.searchParams.get("month") || "";
    const programId = request.nextUrl.searchParams.get("program") || "";
    if (!feeMonthSchema.safeParse(periodMonth).success || (programId && !isValidObjectId(programId))) {
      return NextResponse.json({ success: false, message: "Choose a valid month and class." }, { status: 400 });
    }
    await connectDB();
    const query: Record<string, unknown> = { periodMonth };
    if (programId) query.student = { $in: await Student.find({ program: programId }).distinct("_id") };
    const challans = await FeeChallan.find(query)
      .populate("student", "fullName regNo fatherName classLevel program")
      .populate({ path: "student.program", select: "title" })
      .sort({ challanNo: 1 }).limit(500).lean<ChallanPdfData[]>();
    if (challans.length === 0) return NextResponse.json({ success: false, message: "No challans found for this class and month." }, { status: 404 });
    const merged = await PDFDocument.create();
    for (const challan of challans) {
      const pdf = await PDFDocument.load(await createChallanPdf(challan));
      const pages = await merged.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => merged.addPage(page));
    }
    const bytes = await merged.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="challans-${periodMonth}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/fees/challans/bulk/pdf failed:", error);
    return NextResponse.json({ success: false, message: "Unable to create the bulk challan PDF." }, { status: 500 });
  }
}
