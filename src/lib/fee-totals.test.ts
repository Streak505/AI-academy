import assert from "node:assert/strict";
import test from "node:test";
import { sumFeeTotals } from "@/lib/fee-totals";

test("fee totals separate collected, outstanding, and overdue balances", () => {
  const result = sumFeeTotals([
    { paidAmount: 1000, pendingAmount: 0, status: "Paid" },
    { paidAmount: 500, pendingAmount: 750, status: "Overdue" },
    { paidAmount: 0, pendingAmount: 1200, status: "Unpaid" },
    { paidAmount: 900, pendingAmount: 0, status: "Cancelled" },
  ]);

  assert.deepEqual(result, { collected: 1500, outstanding: 1200, overdue: 750 });
});
