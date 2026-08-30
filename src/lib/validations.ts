export function isValidObjectId(value: unknown) {
  if (typeof value !== "string") return false;
  return /^[a-fA-F0-9]{24}$/.test(value);
}

export function validateEmail(value: unknown) {
  if (typeof value !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidRating(value: unknown) {
  if (typeof value !== "number") return false;
  return Number.isFinite(value) && value >= 1 && value <= 5;
}

export function isValidPrice(value: unknown) {
  if (typeof value !== "number") return false;
  return Number.isFinite(value) && value >= 0;
}

export function isValidString(value: unknown, min = 2, max = 200) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max;
}

export function isValidDate(value: unknown) {
  if (!(value instanceof Date) && typeof value !== "string") return false;
  const date = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(date.getTime());
}

export function isValidEnum(value: unknown, allowed: readonly string[]) {
  return typeof value === "string" && allowed.includes(value);
}

export function parseJsonBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }
  return body as Record<string, unknown>;
}
