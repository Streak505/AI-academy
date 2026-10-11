import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAccessibleStudentIds } from "@/lib/fee-access";
import { feePaymentSchema } from "@/lib/validations";
import { manualPaymentProvider } from "@/lib/payments/manual-provider";
import { FeeChallan } from "@/models/FeeChallan";
import { Payment } from "@/models/Payment";
import { getCurrentUser } from "@/lib/auth";
import { getPrivateBlobToken } from "@/lib/blob";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_REQUEST_SIZE = Math.floor(4.5 * 1024 * 1024);

function validImage(file: File, bytes: Uint8Array) {
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") {
    return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  return false;
}

export async function POST(request: NextRequest) {
  let reserved: { challanId: string; amount: number; dueDate: Date } | null = null;
  let paymentCreated = false;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Authentication is required." }, { status: 401 });
    if (user.role !== "STUDENT" && user.role !== "PARENT") {
      return NextResponse.json({ success: false, message: "Only students and parents can submit fee payments." }, { status: 403 });
    }
    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_REQUEST_SIZE) return NextResponse.json({ success: false, message: "The upload request exceeds the 4.5 MB limit." }, { status: 413 });
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid payment submission." }, { status: 400 });
    }
    const parsed = feePaymentSchema.safeParse({
      challanId: form.get("challanId"),
      method: form.get("method"),
      amount: form.get("amount"),
      transactionId: form.get("transactionId"),
      senderNumber: form.get("senderNumber") || "",
    });
    if (!parsed.success) return NextResponse.json({ success: false, message: "Enter a valid payment method, amount, transaction ID, and sender number." }, { status: 400 });
    const proofField = form.get("proof");
    const file = proofField instanceof File && proofField.size === 0 && proofField.name === "" ? null : proofField;
    if (file !== null && !(file instanceof File)) return NextResponse.json({ success: false, message: "Invalid payment proof file." }, { status: 400 });
    if (file instanceof File && (file.size < 1 || file.size > MAX_FILE_SIZE)) {
      return NextResponse.json({ success: false, message: "Payment screenshots must be no larger than 4 MB." }, { status: 413 });
    }

    await connectDB();
    const studentIds = await getAccessibleStudentIds(user);
    if (!studentIds?.length) return NextResponse.json({ success: false, message: "No linked student record was found." }, { status: 403 });
    const challan = await FeeChallan.findOne({ _id: parsed.data.challanId, student: { $in: studentIds } });
    if (!challan) return NextResponse.json({ success: false, message: "Challan not found." }, { status: 404 });
    if (challan.status === "Paid" || challan.status === "Cancelled") return NextResponse.json({ success: false, message: "This challan cannot accept another payment." }, { status: 409 });

    const submission = await manualPaymentProvider.submit(parsed.data);
    if (await Payment.exists({ method: submission.method, transactionId: submission.transactionId })) {
      return NextResponse.json({ success: false, message: "This transaction ID has already been submitted for this payment method." }, { status: 409 });
    }
    let proofUrl = "";
    let proofFilename = "";
    let proofSize = 0;
    let proofMimeType = "";
    let proofBytes: Uint8Array | null = null;
    if (file instanceof File) {
      proofBytes = new Uint8Array(await file.arrayBuffer());
      if (!validImage(file, proofBytes)) return NextResponse.json({ success: false, message: "Only valid JPG or PNG screenshots are accepted." }, { status: 400 });
      proofFilename = file.name.replace(/[/\\]/g, "_").replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 150);
      proofSize = file.size;
      proofMimeType = file.type;
    }
    const reservation = await FeeChallan.findOneAndUpdate({
      _id: challan._id,
      status: { $nin: ["Paid", "Cancelled"] },
      $expr: { $lte: [{ $add: [{ $ifNull: ["$paidAmount", 0] }, { $ifNull: ["$pendingAmount", 0] }, submission.amount] }, "$total"] },
    }, { $inc: { pendingAmount: submission.amount }, $set: { status: "Pending Verification" } }, { new: true });
    if (!reservation) {
      const current = await FeeChallan.findById(challan._id).select("total paidAmount pendingAmount").lean();
      if (!current) return NextResponse.json({ success: false, message: "Challan not found." }, { status: 404 });
      const remaining = Math.max(0, current.total - (current.paidAmount || 0) - (current.pendingAmount || 0));
      return NextResponse.json({ success: false, message: `Payment exceeds the remaining balance of PKR ${remaining}.` }, { status: 400 });
    }
    reserved = { challanId: String(challan._id), amount: submission.amount, dueDate: challan.dueDate };
    if (file instanceof File && proofBytes) {
      const blob = await put(`fee-payments/${randomUUID()}/${proofFilename}`, Buffer.from(proofBytes), {
        access: "private", addRandomSuffix: true, contentType: file.type, token: getPrivateBlobToken(),
      });
      proofUrl = blob.url;
    }

    const payment = await Payment.create({
      challan: challan._id,
      student: challan.student,
      ...submission,
      proofUrl,
      proofFilename,
      proofSize,
      proofMimeType,
    });
    paymentCreated = true;
    await FeeChallan.updateOne({ _id: challan._id }, { $addToSet: { payments: payment._id } });
    return NextResponse.json({ success: true, data: { id: String(payment._id), status: payment.status } }, { status: 201 });
  } catch (error) {
    if (reserved && !paymentCreated) {
      try {
        await FeeChallan.updateOne({ _id: reserved.challanId }, { $inc: { pendingAmount: -reserved.amount } });
        const pending = await Payment.countDocuments({ challan: reserved.challanId, status: "Pending" });
        if (pending === 0) {
          await FeeChallan.updateOne({ _id: reserved.challanId, status: "Pending Verification" }, {
            $set: { status: reserved.dueDate < new Date() ? "Overdue" : "Unpaid" },
          });
        }
      } catch (rollbackError) {
        console.error("Unable to release fee payment reservation:", rollbackError);
      }
    }
    console.error("POST /api/fees/payments failed:", error);
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ success: false, message: "This transaction ID has already been submitted for this payment method." }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "Unable to submit this payment." }, { status: 500 });
  }
}
