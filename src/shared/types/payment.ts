import type { PAY_METHOD } from "@/shared/constants";

export type PayMethod = (typeof PAY_METHOD)[number];

export type PayStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "PARTIAL_CANCELLED"
  | "REFUNDED";
