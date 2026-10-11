import { model, models, Schema } from "mongoose";

const RateLimitBucketSchema = new Schema({
  _id: { type: String, required: true },
  keyHash: { type: String, required: true, index: true },
  windowId: { type: String, required: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { versionKey: false });

export const RateLimitBucket = models.RateLimitBucket || model("RateLimitBucket", RateLimitBucketSchema);
