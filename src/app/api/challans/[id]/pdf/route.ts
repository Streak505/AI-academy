import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getAccessibleStudentIds } from "@/lib/fee-access";
import { createChallanPdf, type ChallanPdfData } from "@/lib/fee-pdf";
import { FeeChallan } from "@/models/FeeChallan";
import { isValidObjectId } from "@/lib/validations";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    }
    if (!["ADMIN", "STUDENT", "PARENT"].includes(user.role)) return NextResponse.json({ success: false, message: "You do not have access to fee records." }, { status: 403 });
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ success: false, message: "Invalid challan id." }, { status: 400 });
    await connectDB();
    const studentIds = await getAccessibleStudentIds(user);
    const filter: Record<string, unknown> = { _id: id };
    if (studentIds) filter.student = { $in: studentIds };
    const challan = await FeeChallan.findOne(filter).populate("student", "fullName regNo fatherName classLevel program")
      .populate({ path: "student.program", select: "title" }).lean<ChallanPdfData | null>();
    if (!challan) return NextResponse.json({ success: false, message: "Challan not found." }, { status: 404 });
    const bytes = await createChallanPdf(challan);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${challan.challanNo}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET /api/challans/[id]/pdf failed:", error);
    return NextResponse.json({ success: false, message: "Unable to generate this challan PDF." }, { status: 500 });
  }
}
