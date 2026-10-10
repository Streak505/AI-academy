import { Schema, model, models } from "mongoose";

const NoticeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    audience: { type: String, enum: ["all", "students", "parents", "program"], default: "all", index: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", default: null },
    pinned: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

NoticeSchema.index({ audience: 1, publishedAt: -1 });

export const Notice = models.Notice || model("Notice", NoticeSchema);
