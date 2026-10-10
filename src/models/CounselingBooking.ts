import { Schema, model, models } from "mongoose";

const COUNSELING_TYPES = ["Career Assessment", "Degree Selection", "University Selection", "Parent Counseling", "Scholarship Guidance", "Study Abroad"] as const;
const DAYS_OPEN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CounselingBookingSchema = new Schema(
  {
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    type: { type: String, enum: COUNSELING_TYPES, required: true },
    preferredDate: {
      type: Date,
      required: true,
      validate: {
        validator(value: Date) {
          return DAYS_OPEN.includes(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", weekday: "short" }).format(value));
        },
        message: "Counseling bookings are available Monday through Saturday.",
      },
    },
    preferredSlot: {
      type: String,
      required: true,
      validate: {
        validator(value: string) {
          return /^(17|18|19):(00|30)$/.test(value);
        },
        message: "Counseling bookings must be between 17:00 and 20:00.",
      },
    },
    message: { type: String, default: "" },
    status: { type: String, enum: ["Requested", "Confirmed", "Completed", "Cancelled"], default: "Requested", index: true },
    adminNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

CounselingBookingSchema.index({ preferredDate: 1, preferredSlot: 1 });

export const CounselingBooking = models.CounselingBooking || model("CounselingBooking", CounselingBookingSchema);
