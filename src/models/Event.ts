import { Schema, model, models } from "mongoose";

const EventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image: { type: String, default: "" },
    date: { type: Date, required: true },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
    location: { type: String, required: true },
    capacity: { type: Number, min: 1 },
    type: { type: String, enum: ["Workshop", "Seminar", "Webinar", "Orientation", "Competition", "Other"], default: "Workshop" },
    registrationUrl: { type: String, default: "" },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

EventSchema.index({ isPublished: 1, date: 1 });

export const Event = models.Event || model("Event", EventSchema);
