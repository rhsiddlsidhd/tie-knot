import type { PayMethod, PayStatus } from "./payment";
import type { ProductCategory } from "./product-category";
import type { CursorPage } from "./cursor";
import { DEFAULT_PAGE_SIZE } from "./cursor";

// 결제완료 후 청첩장 콘텐츠를 이 기간(일) 안에 입력하지 않으면
// 자동취소+환불 대상이 된다.
export const INVITATION_INPUT_DEADLINE_DAYS = 7;

// 결제창을 띄우기 전에 만들어진 주문(paymentId 없는 PENDING)이 이 시간(시간 단위)을
// 넘기면 버려진 주문으로 보고 자동취소한다. 가상계좌 발급 주문(paymentId 있음)은
// 개별 입금기한을 따르므로 이 만료 대상이 아니다.
export const PENDING_ORDER_EXPIRE_HOURS = 24;

// 만료 배치 한 번이 처리하는 주문 수 상한 — PortOne 동시 호출 수를 묶는다. 두 배치 다
// "아직 처리 안 된 것만" 걸러내는 멱등 구조라 상한을 넘긴 잔여분은 다음 실행이 이어받는다.
export const EXPIRED_ORDER_BATCH_LIMIT = 50;

export type ExpiredPendingOrderBatchResult = {
  scanned: number;
  cancelled: number;
  // PG상 PAID로 확인돼 취소 대신 CONFIRMED로 동기화된 건.
  syncedToConfirmed: number;
  // EXTERNAL_SERVICE 외 사유로 동기화가 실패해 취소를 보류한 건(수동 검토 대상).
  heldForReview: number;
};

export type ExpiredAwaitingInvitationBatchResult = {
  scanned: number;
  cancelled: number;
  // PortOne 환불 호출이 실패한 건 — 다음 실행에서 다시 후보로 잡혀 재시도된다.
  failed: number;
};

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** 결제가 이미 반영된 주문 상태 — 매출/결제주문 집계의 모집단이다.
 *  services/payment.ts의 isPaymentAppliedStatus와 같은 정의를 공유한다. */
export const PAID_ORDER_STATUSES = ["CONFIRMED", "COMPLETED"] as const;

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

export type OrderJSON = {
  _id: string;
  merchantUid: string;
  invitationStatus?: "draft" | "published";
  userId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  product: {
    productId: string;
    category?: ProductCategory;
    title: string;
    thumbnail: string;
    pricing: { originalPrice: number; discountedPrice: number };
    quantity: number;
    selectedFeatures: Array<{
      featureId: string;
      code: string;
      label: string;
      price: number;
    }>;
  };
  finalPrice: number;
  discountRate: number;
  discountAmount: number;
  payMethod: PayMethod;
  orderStatus: OrderStatus;
  paymentId?: string;
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
};

// 가상계좌 발급 주문의 입금 안내 — Payment.methodDetail.virtualAccount에서 목록 표시에
// 필요한 필드만 추린 것이다.
export type OrderVirtualAccount = {
  bank?: string;
  accountNumber: string;
  remitteeName?: string;
  expiredAt?: Date;
};

// my-orders 카드가 "리뷰 작성"/"리뷰 보기·수정" 버튼을 렌더+수정 폼을 미리 채우는 데
// 필요한 최소 필드만 담는다 — 목록 조회 시점에 이미 join하므로 편집 다이얼로그를 열 때
// 별도 조회(route handler 등)가 필요 없다.
export type OrderReviewSummary = {
  id: string;
  rating: number;
  content: string;
  images: string[];
};

// 목록 한 행이 실제로 그리는 데 필요한 것까지 합친 형태 — 주문 문서 자체에는 없고
// 다른 컬렉션(Invitation/Payment/Review)에서 채워지는 값이 붙는다.
export type OrderListItem = OrderJSON & {
  invitationPublicKey?: string;
  virtualAccount?: OrderVirtualAccount;
  // 이 주문에 이미 작성된 리뷰 — 없으면 null. orderStatus===COMPLETED와 이 값의
  // 존재로 "작성/보기·수정" 버튼을 분기한다.
  review: OrderReviewSummary | null;
};

export type OrderListPage = CursorPage<OrderListItem>;

// 목록 한 페이지에 담는 주문 수 — RSC 첫 페이지와 더보기(route handler)가 같은 값을 쓴다.
export const ORDER_PAGE_SIZE = DEFAULT_PAGE_SIZE;

// 관리자 전역 주문 목록 한 행 — my-orders(OrderListItem)와 달리 소유자 스코프가 없고
// Invitation/Payment 조인 없이 주문 스냅샷만으로 표시 가능한 필드만 추린다.
export type AdminOrderListItem = {
  id: string;
  merchantUid: string;
  buyerName: string;
  productTitle: string;
  orderStatus: OrderStatus;
  finalPrice: number;
  createdAt: Date;
};

export type AdminOrderListPage = CursorPage<AdminOrderListItem>;

// 주문 상세의 결제 내역 — Payment 문서에서 화면이 실제로 그리는 필드만 추린다.
export type OrderPaymentSummary = {
  status: PayStatus;
  payMethod?: PayMethod;
  requestAmount: number;
  paidAmount?: number;
  paidAt?: Date;
  failedAt?: Date;
  failReason?: string;
  cancelledAt?: Date;
  cancelAmount?: number;
  cancelReason?: string;
  receiptUrl?: string;
  virtualAccount?: OrderVirtualAccount;
};

export type OrderDetail = {
  order: OrderListItem;
  payment: OrderPaymentSummary | null;
};
