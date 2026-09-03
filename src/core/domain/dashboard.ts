import type { OrderStatus } from "./order";

/** 대시보드 "최근 주문" 한 행 — 화면이 실제로 그리는 필드만 추린다. */
export interface DashboardRecentOrder {
  /** 행 key 겸 관리자에게 보이는 주문 식별자. Order 컬렉션에서 unique다. */
  merchantUid: string;
  buyerName: string;
  /** DB의 product.title(주문 시점 스냅샷)을 평탄화한 것. */
  productTitle: string;
  /** 원 단위 raw number — 통화 포맷은 UI가 한다. */
  finalPrice: number;
  /** raw enum — 라벨/배지는 ORDER_STATUS_LABELS / ORDER_STATUS_BADGE_VARIANTS 재사용. */
  orderStatus: OrderStatus;
  /** JSON 경계를 안 타므로 Date 그대로 UI까지 간다(string 아님). */
  createdAt: Date;
}

export interface DashboardStats {
  // ── 저량(stock) 지표 ────────────────────────────────
  /** 소프트 삭제되지 않은 전체 상품 수(deletedAt: null). */
  totalProducts: number;
  /** 이번 달(KST) 등록된 상품 수. */
  productsCreatedThisMonth: number;
  /** 탈퇴하지 않은 전체 회원 수(deletedAt: null). */
  totalUsers: number;
  /** 이번 달(KST) 가입한 회원 수. */
  usersCreatedThisMonth: number;

  // ── 유량(flow) 지표 ─────────────────────────────────
  //    아래 4개는 모집단이 동일하다: orderStatus ∈ {CONFIRMED, COMPLETED}, confirmedAt 기준.
  //    그래서 revenueThisMonth / paidOrderCountThisMonth = 평균 객단가가 성립한다.
  /** 이번 달(KST) 결제 완료 매출 합계(원). */
  revenueThisMonth: number;
  /** 전월(KST) 결제 완료 매출 합계(원). 0이면 "전월 실적 없음"이다. */
  revenuePreviousMonth: number;
  /** 이번 달(KST) 결제 완료 주문 건수. */
  paidOrderCountThisMonth: number;
  /** 전월(KST) 결제 완료 주문 건수. */
  paidOrderCountPreviousMonth: number;

  // ── 최근 주문 ───────────────────────────────────────
  /** createdAt desc 최대 5건. 상태 필터 없음. 주문이 없으면 빈 배열(REQ-2 빈 상태). */
  recentOrders: DashboardRecentOrder[];
}
