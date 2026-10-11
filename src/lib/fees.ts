import { academy } from "@/config/academy";

export function getFeeMonthRange(periodMonth: string) {
  const [year, month] = periodMonth.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

export function getFeeDueDate(periodMonth: string) {
  const [year, month] = periodMonth.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1, Math.min(academy.fees.dueDay, lastDay), 18));
}

export function calculateLateFee(dueDate: Date, asOf = new Date()) {
  if (asOf <= dueDate) return 0;
  const charge = academy.fees.lateFee.type === "flat"
    ? academy.fees.lateFee.amount
    : academy.fees.lateFee.perDay;
  if (!Number.isSafeInteger(charge) || charge < 0) throw new Error("The configured late fee must be a non-negative whole PKR amount.");
  if (academy.fees.lateFee.type === "flat") return charge;
  const daysLate = Math.max(1, Math.ceil((asOf.getTime() - dueDate.getTime()) / 86_400_000));
  const total = daysLate * charge;
  if (!Number.isSafeInteger(total)) throw new Error("The calculated late fee exceeds the supported whole PKR range.");
  return total;
}

export function calculateConcession(monthlyFee: number, percent: number) {
  const integerPercent = Math.max(0, Math.min(100, Math.trunc(percent)));
  const quotient = Math.floor(monthlyFee / 100);
  const remainder = monthlyFee % 100;
  return quotient * integerPercent + Math.floor((remainder * integerPercent + 50) / 100);
}

export function formatPkr(amount: number) {
  return `PKR ${new Intl.NumberFormat("en-PK").format(amount)}`;
}
