import mongoose, { Schema, model, models } from "mongoose";

const AnnouncementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["General", "Admission", "Course", "Exam", "Event", "Important"], default: "General" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export const Announcement = models.Announcement || model("Announcement", AnnouncementSchema);
