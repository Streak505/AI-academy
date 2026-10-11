import { Schema, model, models } from "mongoose";

const CounselingSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    capacityPerSlot: { type: Number, required: true, min: 1, max: 20, default: 1 },
  },
  { timestamps: true }
);

export const CounselingSettings = models.CounselingSettings || model("CounselingSettings", CounselingSettingsSchema);
