import type { PaymentProvider } from "@/lib/payments/types";

export const manualPaymentProvider: PaymentProvider = {
  async submit(input) {
    return {
      ...input,
      transactionId: input.transactionId.trim(),
      senderNumber: input.senderNumber.trim(),
    };
  },
};
