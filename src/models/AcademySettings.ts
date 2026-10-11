import { Schema, model, models } from "mongoose";

const AcademySettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "public" },
    phone: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    mapsEmbedUrl: { type: String, default: "" },
    mapsLink: { type: String, default: "" },
    timing: {
      days: { type: String, default: "" },
      from: { type: String, default: "" },
      to: { type: String, default: "" },
    },
    socials: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const AcademySettings = models.AcademySettings || model("AcademySettings", AcademySettingsSchema);
