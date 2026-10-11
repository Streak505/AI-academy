import { Schema, model, models } from "mongoose";

const PaymentSchema = new Schema(
  {
    challan: { type: Schema.Types.ObjectId, ref: "FeeChallan", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    method: { type: String, enum: ["EasyPaisa", "JazzCash", "BankTransfer"], required: true },
    amount: { type: Number, required: true, min: 1, validate: Number.isInteger },
    transactionId: { type: String, required: true, trim: true },
    senderNumber: { type: String, default: "", trim: true },
    proofUrl: { type: String, default: "" },
    proofFilename: { type: String, default: "" },
    proofSize: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    proofMimeType: { type: String, default: "" },
    status: { type: String, enum: ["Pending", "Verified", "Rejected"], default: "Pending", index: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

PaymentSchema.index({ student: 1, status: 1, createdAt: -1 });
PaymentSchema.index(
  { method: 1, transactionId: 1 },
  { unique: true, partialFilterExpression: { transactionId: { $type: "string", $gt: "" } } }
);

export const Payment = models.Payment || model("Payment", PaymentSchema);
