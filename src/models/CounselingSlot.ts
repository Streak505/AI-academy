import { Schema, model, models } from "mongoose";

const CounselingSlotSchema = new Schema(
  {
    slotKey: { type: String, required: true, unique: true },
    bookedCount: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

export const CounselingSlot = models.CounselingSlot || model("CounselingSlot", CounselingSlotSchema);
