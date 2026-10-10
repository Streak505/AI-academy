import { Schema, model, models } from "mongoose";

// DEPRECATED: not part of Shahzaib Royal Academy scope
const CourseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: { type: String, default: "" },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    instructor: { type: Schema.Types.ObjectId, ref: "Instructor", required: true },
    duration: { type: String, required: true },
    level: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    mode: { type: String, enum: ["Online", "Onsite", "Hybrid"], required: true },
    features: [{ type: String }],
    syllabus: [{ type: String }],
    lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    quizzes: [{ type: Schema.Types.ObjectId, ref: "Quiz" }],
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CourseSchema.index({ category: 1, level: 1, mode: 1 });

export const Course = models.Course || model("Course", CourseSchema);
