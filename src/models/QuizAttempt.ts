import { Schema, model, models } from "mongoose";

const QuizAttemptSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    score: { type: Number, default: 0, min: 0 },
    totalQuestions: { type: Number, default: 0, min: 0 },
    correctAnswers: { type: Number, default: 0, min: 0 },
    incorrectAnswers: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    passed: { type: Boolean, default: false },
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    submittedAt: { type: Date, default: Date.now },
    answers: [
      {
        questionId: { type: String, required: true },
        selectedOption: { type: Number, default: -1 },
        correctAnswer: { type: Number, default: -1 },
        isCorrect: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

QuizAttemptSchema.index({ student: 1, quiz: 1, submittedAt: -1 });

export const QuizAttempt = models.QuizAttempt || model("QuizAttempt", QuizAttemptSchema);
