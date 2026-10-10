import { Schema, model, models } from "mongoose";

// DEPRECATED: not part of Shahzaib Royal Academy scope
const QuestionSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    options: [{ type: String, required: true, trim: true }],
    correctAnswer: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: "" },
  },
  { _id: true }
);

const QuizSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    questions: { type: [QuestionSchema], required: true, validate: [{ validator: (value: any[]) => Array.isArray(value) && value.length > 0, message: "A quiz must include at least one question." }] },
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

QuizSchema.index({ course: 1, isPublished: 1, createdAt: -1 });

export const Quiz = models.Quiz || model("Quiz", QuizSchema);
