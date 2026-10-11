import { Schema, model, models } from "mongoose";

const FeeStructureSchema = new Schema(
  {
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true, index: true },
    monthlyFee: { type: Number, required: true, min: 0, validate: Number.isInteger },
    admissionFee: { type: Number, required: true, min: 0, validate: Number.isInteger },
    annualCharges: { type: Number, required: true, min: 0, validate: Number.isInteger },
    effectiveFrom: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

FeeStructureSchema.index({ program: 1, effectiveFrom: -1 });
FeeStructureSchema.index({ program: 1, effectiveFrom: 1 }, { unique: true });

export const FeeStructure = models.FeeStructure || model("FeeStructure", FeeStructureSchema);
