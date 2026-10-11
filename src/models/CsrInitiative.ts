import { Schema, model, models } from "mongoose";

const CsrInitiativeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    icon: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    order: { type: Number, default: 0, min: 0 },
    isPublished: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

CsrInitiativeSchema.index({ order: 1, isPublished: 1 });

export const CsrInitiative = models.CsrInitiative || model("CsrInitiative", CsrInitiativeSchema);
