export const PAY_METHOD = [
  "CARD",
  "TRANSFER",
  "VIRTUAL_ACCOUNT",
  "MOBILE",
  "GIFT_CERTIFICATE",
  "EASY_PAY",
] as const;

export type PayMethod = (typeof PAY_METHOD)[number];

export type PayStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "PARTIAL_CANCELLED"
  | "REFUNDED";
