export const COUNSELING_SLOTS = Array.from({ length: 6 }, (_, index) => {
  const minutes = 17 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

export function isValidCounselingDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", weekday: "short" }).format(date);
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].includes(weekday);
}

export function isValidCounselingSlot(date: string, slot: string) {
  return isValidCounselingDate(date) && COUNSELING_SLOTS.includes(slot);
}
