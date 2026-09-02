import type { OrderStatus } from "@/core/domain/order";
import type { PayMethod } from "@/core/domain/payment";

// 상태 탭 라벨 — 여러 카테고리가 섞여 보이는 자리(카테고리 필터가 "전체")라 중립어를 쓴다.
export const ORDER_STATUS_TAB_LABELS: Record<OrderStatus, string> = {
  PENDING: "주문대기",
  CONFIRMED: "결제완료",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

export const PAY_METHOD_LABEL: Record<PayMethod, string> = {
  CARD: "신용카드",
  TRANSFER: "실시간 계좌이체",
  VIRTUAL_ACCOUNT: "가상계좌",
  MOBILE: "휴대폰 소액결제",
  GIFT_CERTIFICATE: "상품권",
  EASY_PAY: "간편결제",
};
