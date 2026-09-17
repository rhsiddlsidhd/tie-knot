const PAY_METHOD = [
  "CARD",
  "TRANSFER",
  "VIRTUAL_ACCOUNT",
  "MOBILE",
  "GIFT_CERTIFICATE",
  "EASY_PAY",
] as const;

type PayMethod = (typeof PAY_METHOD)[number];

const PAY_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "PARTIAL_CANCELLED",
  "REFUNDED",
] as const;

type PayStatus = (typeof PAY_STATUSES)[number];

export { PAY_METHOD, PAY_STATUSES, type PayMethod, type PayStatus };
