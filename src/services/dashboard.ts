import "server-only";
import { OrderModel, ProductModel, UserModel } from "@/models";
import type {
  DashboardStats,
  DashboardRecentOrder,
  OrderStatus,
} from "@/core/domain";
import { AppError, PAID_ORDER_STATUSES } from "@/core/domain";
import { getKstMonthRange } from "@/core/utils";
import { dbConnect } from "@/db";

type OrderMonthlyBucket = {
  _id: "current" | "previous";
  revenue: number;
  orderCount: number;
};

type ProductMonthlyStats = {
  _id: null;
  total: number;
  createdThisMonth: number;
};

type UserMonthlyStats = {
  _id: null;
  total: number;
  createdThisMonth: number;
};

type RecentOrderLean = {
  merchantUid: string;
  buyerName: string;
  product: { title: string };
  finalPrice: number;
  orderStatus: OrderStatus;
  createdAt: Date;
};

/**
 * admin 대시보드 4개 카드(등록 상품/총 매출/결제 주문/활동 회원) + 최근 주문 5건.
 * 파라미터 없음, envelope 없음 — Server Component(`page.tsx`)가 직접 await한다.
 * 인증은 여기서 검사하지 않는다(`page.tsx`의 verifySession("ADMIN")가 전담).
 */
export const getDashboardStatsService = async (): Promise<DashboardStats> => {
  await dbConnect();

  const { startOfLastMonth, startOfThisMonth, startOfNextMonth } =
    getKstMonthRange();

  const [orderBuckets, productStats, userStats, recentOrdersRaw] =
    await Promise.all([
      // Q1 — 매출 + 결제 주문수(이번달/전달 한 방). 결제 반영 상태(CONFIRMED|COMPLETED)만,
      // 기준 시각은 confirmedAt. { orderStatus: 1, confirmedAt: 1 } 인덱스가 완전 커버한다.
      OrderModel.aggregate<OrderMonthlyBucket>([
        {
          $match: {
            orderStatus: { $in: PAID_ORDER_STATUSES },
            confirmedAt: { $gte: startOfLastMonth, $lt: startOfNextMonth },
          },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $gte: ["$confirmedAt", startOfThisMonth] },
                "current",
                "previous",
              ],
            },
            revenue: { $sum: "$finalPrice" },
            orderCount: { $sum: 1 },
          },
        },
      ]),
      // Q3 — 상품 총계 + 이번달 신규(한 스캔). 소프트 삭제는 deletedAt: null 기준.
      ProductModel.aggregate<ProductMonthlyStats>([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            createdThisMonth: {
              $sum: { $cond: [{ $gte: ["$createdAt", startOfThisMonth] }, 1, 0] },
            },
          },
        },
      ]),
      // Q4 — 회원 총계 + 이번달 신규(한 스캔). 소프트 삭제는 isDelete: false 기준.
      UserModel.aggregate<UserMonthlyStats>([
        { $match: { isDelete: false } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            createdThisMonth: {
              $sum: { $cond: [{ $gte: ["$createdAt", startOfThisMonth] }, 1, 0] },
            },
          },
        },
      ]),
      // Q2 — 최근 주문 5건. 상태 필터 없이 createdAt desc. { createdAt: -1 } 인덱스 필요.
      OrderModel.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select(
          "merchantUid buyerName product.title finalPrice orderStatus createdAt",
        )
        .lean<RecentOrderLean[]>(),
    ]).catch((error) => {
      throw new AppError(
        "INTERNAL",
        error instanceof Error
          ? error.message
          : "대시보드 통계 조회에 실패했습니다.",
      );
    });

  // $group 결과는 해당 월에 결제 완료 주문이 0건이면 버킷 행 자체가 안 나온다 — ?? 0 폴백 필수.
  const currentBucket = orderBuckets.find((bucket) => bucket._id === "current");
  const previousBucket = orderBuckets.find(
    (bucket) => bucket._id === "previous",
  );

  const productAgg = productStats[0];
  const userAgg = userStats[0];

  const recentOrders: DashboardRecentOrder[] = recentOrdersRaw.map((order) => ({
    merchantUid: order.merchantUid,
    buyerName: order.buyerName,
    productTitle: order.product.title,
    finalPrice: order.finalPrice,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
  }));

  return {
    totalProducts: productAgg?.total ?? 0,
    productsCreatedThisMonth: productAgg?.createdThisMonth ?? 0,
    totalUsers: userAgg?.total ?? 0,
    usersCreatedThisMonth: userAgg?.createdThisMonth ?? 0,
    revenueThisMonth: currentBucket?.revenue ?? 0,
    revenuePreviousMonth: previousBucket?.revenue ?? 0,
    paidOrderCountThisMonth: currentBucket?.orderCount ?? 0,
    paidOrderCountPreviousMonth: previousBucket?.orderCount ?? 0,
    recentOrders,
  };
};
