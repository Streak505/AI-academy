import { Schema, model, models } from "mongoose";

const AssignmentSubmissionSchema = new Schema(
  {
    assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    fileUrl: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    feedback: { type: String, default: "" },
    grade: { type: String, default: "" },
  },
  { timestamps: true }
);

AssignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export const AssignmentSubmission = models.AssignmentSubmission || model("AssignmentSubmission", AssignmentSubmissionSchema);
