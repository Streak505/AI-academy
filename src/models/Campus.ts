import { Schema, model, models } from "mongoose";

const CampusSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    image: { type: String, default: "" },
    mapUrl: { type: String, default: "" },
    facilities: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Campus = models.Campus || model("Campus", CampusSchema);
