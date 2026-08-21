import type { OrderStatus } from "@/core/domain";

export interface MockOrder {
  merchantUid: string;
  buyerName: string;
  productTitle: string;
  orderStatus: OrderStatus;
  finalPrice: number;
}

// mock UI만 구현 — 실제 주문 전체조회 API/서비스는 아직 없다(별도 Issue 대상).
export const MOCK_ORDERS: MockOrder[] = [
  {
    merchantUid: "TK-20260821-0142",
    buyerName: "김민준",
    productTitle: "봄빛 청첩장 세트",
    orderStatus: "CONFIRMED",
    finalPrice: 31000,
  },
  {
    merchantUid: "TK-20260821-0141",
    buyerName: "이서연",
    productTitle: "클래식 리넨 청첩장",
    orderStatus: "COMPLETED",
    finalPrice: 22000,
  },
  {
    merchantUid: "TK-20260820-0140",
    buyerName: "박지훈",
    productTitle: "가든웨딩 카드",
    orderStatus: "COMPLETED",
    finalPrice: 22000,
  },
  {
    merchantUid: "TK-20260719-0139",
    buyerName: "최유나",
    productTitle: "가을 무드 청첩장",
    orderStatus: "CANCELLED",
    finalPrice: 28000,
  },
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "주문대기",
  CONFIRMED: "결제완료",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

export const ORDER_STATUS_BADGE_VARIANTS: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
};
