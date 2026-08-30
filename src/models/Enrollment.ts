import mongoose, { Schema, model, models } from "mongoose";

const EnrollmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    enrollmentDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["Active", "Completed", "Cancelled"], default: "Active" },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completedLessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    lastLesson: { type: Schema.Types.ObjectId, ref: "Lesson" },
    lastAccessedAt: { type: Date, default: Date.now },
    completionDate: { type: Date },
    certificateIssued: { type: Boolean, default: false },
    certificateCode: { type: String, default: "" },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment = models.Enrollment || model("Enrollment", EnrollmentSchema);
