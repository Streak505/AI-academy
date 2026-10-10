import { Schema, model, models } from "mongoose";

const subjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    totalMarks: { type: Number, required: true, min: 1, validate: Number.isInteger },
    obtainedMarks: { type: Number, required: true, min: 0, validate: Number.isInteger },
  },
  { _id: false }
);

const AssessmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", default: null, index: true },
    classLevel: { type: String, default: "", trim: true },
    examName: { type: String, required: true, trim: true },
    term: { type: String, required: true, trim: true },
    subjects: { type: [subjectSchema], default: [] },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String, default: "" },
    remarks: { type: String, default: "" },
    publishedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

AssessmentSchema.index({ student: 1, publishedAt: -1 });

export const Assessment = models.Assessment || model("Assessment", AssessmentSchema);
