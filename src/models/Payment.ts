import { Schema, model, models } from "mongoose";

const PaymentSchema = new Schema(
  {
    challan: { type: Schema.Types.ObjectId, ref: "FeeChallan", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    method: { type: String, enum: ["EasyPaisa", "JazzCash", "BankTransfer", "Cash"], required: true },
    amount: { type: Number, required: true, min: 1, validate: Number.isInteger },
    transactionId: { type: String, default: "", trim: true },
    senderNumber: { type: String, default: "", trim: true },
    proofUrl: { type: String, default: "" },
    status: { type: String, enum: ["Pending", "Verified", "Rejected"], default: "Pending", index: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

PaymentSchema.index({ student: 1, status: 1, createdAt: -1 });

export const Payment = models.Payment || model("Payment", PaymentSchema);
