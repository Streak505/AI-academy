import { createHash } from "node:crypto";
import { connectDB } from "@/lib/db";
import { RateLimitBucket } from "@/models/RateLimitBucket";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function checkRateLimit(key: string, maxRequests = 5, windowMs = 60 * 1000) {
  if (!key || !Number.isInteger(maxRequests) || maxRequests < 1 || !Number.isInteger(windowMs) || windowMs < 1) {
    throw new Error("Rate-limit key, request maximum, and window must be valid.");
  }
  await connectDB();
  const now = Date.now();
  const windowNumber = Math.floor(now / windowMs);
  const keyHash = hash(key);
  const windowId = String(windowNumber);
  const resetAt = new Date((windowNumber + 1) * windowMs);
  const bucketId = `${keyHash}:${windowId}`;
  const update = {
    $inc: { count: 1 },
    $setOnInsert: { keyHash, windowId, expiresAt: new Date(resetAt.getTime() + windowMs) },
  };
  let bucket;
  try {
    bucket = await RateLimitBucket.findOneAndUpdate(
      { _id: bucketId },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
  } catch (error) {
    if (!error || typeof error !== "object" || !("code" in error) || error.code !== 11000) throw error;
    bucket = await RateLimitBucket.findOneAndUpdate(
      { _id: bucketId },
      { $inc: { count: 1 } },
      { new: true },
    ).lean();
  }
  if (!bucket) throw new Error("Could not update the rate-limit counter.");
  const allowed = bucket.count <= maxRequests;
  return {
    allowed,
    remaining: Math.max(0, maxRequests - bucket.count),
    ...(!allowed ? { retryAfterMs: Math.max(0, resetAt.getTime() - now) } : {}),
  };
}

export async function clearRateLimit(key: string) {
  await connectDB();
  await RateLimitBucket.deleteMany({ keyHash: hash(key) });
}
