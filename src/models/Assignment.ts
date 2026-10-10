import { Schema, model, models } from "mongoose";

const AssignmentSchema = new Schema(
  {
    program: { type: Schema.Types.ObjectId, ref: "Program", default: null, index: true },
    classLevel: { type: String, default: "", trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    fileUrl: { type: String, default: "" },
    dueDate: { type: Date, required: true, index: true },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AssignmentSchema.index({ program: 1, dueDate: 1 });

export const Assignment = models.Assignment || model("Assignment", AssignmentSchema);
