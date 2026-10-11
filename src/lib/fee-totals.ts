export type FeeTotalRow = {
  paidAmount: number;
  pendingAmount: number;
  status: string;
};

export function sumFeeTotals(challans: FeeTotalRow[]) {
  return challans.reduce(
    (totals, challan) => {
      if (challan.status !== "Cancelled") {
        totals.collected += challan.paidAmount;
        if (challan.status === "Overdue") totals.overdue += challan.pendingAmount;
        else totals.outstanding += challan.pendingAmount;
      }
      return totals;
    },
    { collected: 0, outstanding: 0, overdue: 0 }
  );
}
