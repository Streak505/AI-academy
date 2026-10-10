import { Schema, model, models } from "mongoose";

const ReviewSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true },
    avatar: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ course: 1, isPublished: 1 });

export const Review = models.Review || model("Review", ReviewSchema);
