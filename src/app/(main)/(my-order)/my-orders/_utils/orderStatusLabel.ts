import type { OrderStatus } from "@/core/domain/order";
import type { ProductCategory } from "@/core/domain/product-category";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";

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
  [MOBILE_INVITATION_CATEGORY]: {
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
