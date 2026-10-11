import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { FeeChallan } from "@/models/FeeChallan";
import { Payment } from "@/models/Payment";
import { isValidObjectId } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { recordAdminAudit } from "@/lib/admin-audit";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const admin = await getCurrentUser();
    if (!admin) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (admin.role !== "ADMIN") return NextResponse.json({ success: false, message: "Administrator access is required." }, { status: 403 });
    const { id } = await params;
    if (!isValidObjectId(id)) return NextResponse.json({ success: false, message: "Invalid payment id." }, { status: 400 });
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    if (!["Verified", "Rejected"].includes(String(input.decision))) {
      return NextResponse.json({ success: false, message: "Choose verify or reject." }, { status: 400 });
    }
    const note = typeof input.note === "string" ? input.note.trim().slice(0, 500) : "";
    if (input.decision === "Rejected" && !note) return NextResponse.json({ success: false, message: "Add a reason when rejecting a payment." }, { status: 400 });

    await connectDB();
    const payment = await Payment.findOneAndUpdate(
      { _id: id, status: "Pending" },
      { $set: { status: input.decision, note, verifiedBy: admin.id, verifiedAt: new Date() } },
      { new: true }
    );
    if (!payment) return NextResponse.json({ success: false, message: "This payment was already reviewed or no longer exists." }, { status: 409 });
    await recordAdminAudit(admin, request, "FEE_PAYMENT_REVIEWED", "Payment", String(payment._id), {
      status: payment.status,
      amount: payment.amount,
      note,
    });

    const [challan, totals, pendingTotals] = await Promise.all([
      FeeChallan.findById(payment.challan),
      Payment.aggregate([{ $match: { challan: payment.challan, status: "Verified" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Payment.aggregate([{ $match: { challan: payment.challan, status: "Pending" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    ]);
    if (!challan) return NextResponse.json({ success: false, message: "Payment challan no longer exists." }, { status: 409 });
    challan.paidAmount = Number(totals[0]?.total || 0);
    challan.pendingAmount = Number(pendingTotals[0]?.total || 0);
    if (challan.paidAmount >= challan.total) challan.status = "Paid";
    else if (input.decision === "Rejected") challan.status = "Unpaid";
    else if (challan.pendingAmount > 0) challan.status = "Pending Verification";
    else challan.status = challan.dueDate < new Date() ? "Overdue" : "Unpaid";
    await challan.save();
    await notify({
      studentId: String(payment.student),
      type: input.decision === "Verified" ? "PaymentVerified" : "PaymentRejected",
      key: `payment:${payment._id}:${input.decision}`,
      detail: `PKR ${payment.amount}${note ? ` — ${note}` : ""}`,
    });
    return NextResponse.json({ success: true, data: { paymentId: String(payment._id), challanStatus: challan.status, paidAmount: challan.paidAmount } });
  } catch (error) {
    console.error("PATCH /api/fees/payments/[id] failed:", error);
    return NextResponse.json({ success: false, message: "Unable to review this payment." }, { status: 500 });
  }
}
