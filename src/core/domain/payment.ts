const PAY_METHOD = [
  "CARD",
  "TRANSFER",
  "VIRTUAL_ACCOUNT",
  "MOBILE",
  "GIFT_CERTIFICATE",
  "EASY_PAY",
] as const;

type PayMethod = (typeof PAY_METHOD)[number];

type PayStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "PARTIAL_CANCELLED"
  | "REFUNDED";

export { PAY_METHOD, type PayMethod, type PayStatus };
