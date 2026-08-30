import mongoose, { Schema, model, models } from "mongoose";

const LessonSchema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, default: "" },
    description: { type: String, default: "" },
    content: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    duration: { type: String, default: "" },
    order: { type: Number, default: 1 },
    resources: [{ type: String }],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LessonSchema.index({ course: 1, order: 1 });

export const Lesson = models.Lesson || model("Lesson", LessonSchema);
