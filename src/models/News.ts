import { Schema, model, models } from "mongoose";

const NewsSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    excerpt: { type: String, default: "" },
    content: { type: String, required: true },
    image: { type: String, default: "" },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    category: { type: String, default: "Academy" },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

NewsSchema.index({ isPublished: 1, publishedAt: -1 });

export const News = models.News || model("News", NewsSchema);
