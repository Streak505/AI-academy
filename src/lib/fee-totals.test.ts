import { describe, expect, it } from "vitest";
import { FeeChallan } from "@/models/FeeChallan";
import { calculateConcession } from "@/lib/fees";
import { sumFeeTotals } from "@/lib/fee-totals";

describe("fee calculations", () => {
  it("separates collected, outstanding, and overdue balances", () => {
    const result = sumFeeTotals([
      { paidAmount: 1000, pendingAmount: 0, status: "Paid" },
      { paidAmount: 500, pendingAmount: 750, status: "Overdue" },
      { paidAmount: 0, pendingAmount: 1200, status: "Unpaid" },
      { paidAmount: 900, pendingAmount: 0, status: "Cancelled" },
    ]);

    expect(result).toEqual({ collected: 1500, outstanding: 1200, overdue: 750 });
  });

  it("calculates rounded, clamped whole-PKR concessions", () => {
    expect(calculateConcession(101, 50)).toBe(51);
    expect(calculateConcession(199, 33)).toBe(66);
    expect(calculateConcession(1000, 150)).toBe(1000);
    expect(calculateConcession(1000, -5)).toBe(0);
  });

  it("enforces one challan per student and month at the database index", () => {
    const uniqueIndex = FeeChallan.schema.indexes().find(([keys]) => "student" in keys && "periodMonth" in keys);
    expect(uniqueIndex?.[1]).toMatchObject({ unique: true });
  });
});
