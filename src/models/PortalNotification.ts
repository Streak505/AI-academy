import { Schema, model, models } from "mongoose";

const PortalNotificationSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    type: { type: String, enum: ["Absent", "Result", "Challan", "PaymentVerified", "PaymentRejected"], required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PortalNotification = models.PortalNotification || model("PortalNotification", PortalNotificationSchema);
