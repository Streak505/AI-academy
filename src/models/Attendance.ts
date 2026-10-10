import { Schema, model, models } from "mongoose";

function normalizeAcademyDay(value: Date) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
  return new Date(`${day}T00:00:00+05:00`);
}

const AttendanceSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    date: { type: Date, required: true, set: normalizeAcademyDay },
    status: { type: String, enum: ["Present", "Absent", "Late", "Leave"], required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AttendanceSchema.index({ student: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1, status: 1 });

export const Attendance = models.Attendance || model("Attendance", AttendanceSchema);
