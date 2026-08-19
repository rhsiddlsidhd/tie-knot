import type { OrderStatus, PayMethod, ProductCategory } from "@/core/domain";

// 상태 탭 라벨 — 여러 카테고리가 섞여 보이는 자리(카테고리 필터가 "전체")라 중립어를 쓴다.
export const ORDER_STATUS_TAB_LABELS: Record<OrderStatus, string> = {
  PENDING: "주문대기",
  CONFIRMED: "결제완료",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

// 행 배지 기본값 — 배송이 실체인 물리 상품(답례품/웨딩소품/방명록 굿즈/예식 용품) 기준.
const DEFAULT_ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "주문대기",
  CONFIRMED: "배송준비중",
  COMPLETED: "배송완료",
  CANCELLED: "취소",
};

// 카테고리별 예외만 덮어쓴다 — 물리 상품은 아직 구현체가 없어 위 기본값이 그대로 fallback이 된다.
const CATEGORY_ORDER_STATUS_LABELS: Partial<
  Record<ProductCategory, Partial<Record<OrderStatus, string>>>
> = {
  invitation: {
    CONFIRMED: "정보입력 대기",
    COMPLETED: "발행완료",
  },
};

export const resolveOrderStatusLabel = (
  status: OrderStatus,
  category?: ProductCategory,
): string =>
  (category && CATEGORY_ORDER_STATUS_LABELS[category]?.[status]) ??
  DEFAULT_ORDER_STATUS_LABELS[status];

export const PAY_METHOD_LABEL: Record<PayMethod, string> = {
  CARD: "신용카드",
  TRANSFER: "실시간 계좌이체",
  VIRTUAL_ACCOUNT: "가상계좌",
  MOBILE: "휴대폰 소액결제",
  GIFT_CERTIFICATE: "상품권",
  EASY_PAY: "간편결제",
};
