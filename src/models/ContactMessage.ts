import mongoose, { Schema, model, models } from "mongoose";

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "" },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["Unread", "Read", "Resolved"], default: "Unread" },
  },
  { timestamps: true }
);

export const ContactMessage = models.ContactMessage || model("ContactMessage", ContactMessageSchema);
