import type { PAYMENT_METHODS } from "@/lib/validations";

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type PaymentSubmission = {
  method: PaymentMethod;
  amount: number;
  transactionId: string;
  senderNumber: string;
};

export interface PaymentProvider {
  submit(input: PaymentSubmission): Promise<PaymentSubmission>;
}
