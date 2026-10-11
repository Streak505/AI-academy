import { Schema, model, models } from "mongoose";

const itemSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0, validate: Number.isInteger },
  },
  { _id: false }
);

const FeeChallanSchema = new Schema(
  {
    challanNo: { type: String, required: true, unique: true, trim: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    periodMonth: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    items: { type: [itemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0, validate: Number.isInteger },
    discount: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    lateFee: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    paidAmount: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    pendingAmount: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    total: { type: Number, required: true, min: 0, validate: Number.isInteger },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["Unpaid", "Pending Verification", "Paid", "Overdue", "Cancelled"], default: "Unpaid", index: true },
    payments: [{ type: Schema.Types.ObjectId, ref: "Payment" }],
    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pdfUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

FeeChallanSchema.index({ student: 1, periodMonth: 1 }, { unique: true, name: "fee_challan_student_month_unique" });
FeeChallanSchema.index({ periodMonth: 1, status: 1 });

export const FeeChallan = models.FeeChallan || model("FeeChallan", FeeChallanSchema);
