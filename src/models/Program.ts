import { Schema, model, models } from "mongoose";

export const PROGRAM_GROUPS = ["academic", "career", "entrepreneurship", "international", "professional"] as const;
export const PROGRAM_MODES = ["Physical", "Online", "Hybrid"] as const;

const ProgramSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    group: { type: String, enum: PROGRAM_GROUPS, required: true, index: true },
    level: { type: String, default: "" },
    description: { type: String, required: true, trim: true },
    features: [{ type: String, trim: true }],
    duration: { type: String, default: "" },
    monthlyFee: { type: Number, required: true, min: 0, validate: Number.isInteger },
    admissionFee: { type: Number, required: true, min: 0, validate: Number.isInteger },
    mode: { type: String, enum: PROGRAM_MODES, default: "Physical" },
    isPublished: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

ProgramSchema.index({ group: 1, order: 1 });

export const Program = models.Program || model("Program", ProgramSchema);
