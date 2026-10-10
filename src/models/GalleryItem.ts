import { Schema, model, models } from "mongoose";

const GalleryItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    caption: { type: String, default: "" },
    category: { type: String, enum: ["events", "workshops", "achievements", "csr"], required: true, index: true },
    imageUrl: { type: String, required: true, trim: true },
    order: { type: Number, default: 0, min: 0 },
    isPublished: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

GalleryItemSchema.index({ category: 1, order: 1 });

export const GalleryItem = models.GalleryItem || model("GalleryItem", GalleryItemSchema);
