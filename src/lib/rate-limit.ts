type RateBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateBucket>();

export function checkRateLimit(key: string, maxRequests = 5, windowMs = 60 * 1000) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, current.resetAt - now) };
  }

  current.count += 1;
  buckets.set(key, current);
  return { allowed: true, remaining: maxRequests - current.count };
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}
