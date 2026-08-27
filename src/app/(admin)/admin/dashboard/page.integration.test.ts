// @vitest-environment node
//
// page.tsx가 verifySession → getDashboardStatsService → AdminDashboardTemplate로
// 이어지는 배선을 실제로 올바르게 연결하는지 검증한다. 서비스 내부 집계 로직
// 자체는 src/services/dashboard.integration.test.ts(11건)가, Template 렌더
// 계약(상태 A~D)은 AdminDashboardTemplate.test.tsx(4케이스)가 이미 담당하므로
// 여기서 다시 검증하지 않는다. (main)/page.integration.test.ts와 같은 이유로
// JSX는 함수 호출이 아니라 엘리먼트 서술자라, `await page()`가 반환한 엘리먼트의
// props만 검사하고 렌더링은 하지 않는다(jsdom 불필요, 하위 Template 바디도
// 실행되지 않는다).
//
// 인증 경계는 auth.integration.test.ts가 verifySession() 자체의 redirect 계약을
// (세션 없음/role 불일치/성공 3가지) 이미 촘촘히 덮고 있다. 여기서는 그 함수
// 자체를 다시 검증하지 않고, "page.tsx가 verifySession('ADMIN')을 실제로 그
// 인자로 호출하는지"와 "실패 시 뒤 단계(getDashboardStatsService)로 진행하지
// 않는지"(01_ui_flow.md §6 "순차 await, Promise.all 아님" 계약)만 회귀 확인한다
// — route.integration.test.ts가 requireAuth를 partial mock으로 대체하는 것과
// 같은 원리(세션/쿠키/JWT 발급 자체는 이 페이지의 검증 대상이 아니다).
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import type * as ServicesModule from "@/services";
import { dbConnect } from "@/db";
import {
  buildOrderInput,
  buildProductInput,
  buildUserInput,
  clearCollections,
} from "@testing/support";
import { OrderModel, ProductModel } from "@/models";

const { authState } = vi.hoisted(() => ({
  authState: { role: "ADMIN" as "ADMIN" | "USER" | null },
}));

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof ServicesModule>();
  return {
    ...actual,
    verifySession: vi.fn(async (requiredRole?: string) => {
      if (!authState.role) {
        throw new Error("REDIRECT:/login");
      }
      if (requiredRole && authState.role !== requiredRole) {
        throw new Error("REDIRECT:/");
      }
      return {
        userId: "admin-id",
        email: "admin@example.com",
        role: authState.role,
      };
    }),
    getDashboardStatsService: vi.fn(actual.getDashboardStatsService),
  };
});

import {
  createOrderService,
  createProductService,
  getDashboardStatsService,
  verifySession,
} from "@/services";
import { UserModel } from "@/models";
import page from "./page";

describe("(admin)/admin/dashboard/page — 통합(DB~page.tsx 데이터 배선)", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
    authState.role = "ADMIN";
    vi.mocked(verifySession).mockClear();
    vi.mocked(getDashboardStatsService).mockClear();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("골든패스: DB에 시딩한 실제 데이터가 getDashboardStatsService를 거쳐 AdminDashboardTemplate의 stats prop으로 그대로 전달된다", async () => {
    const productInput = buildProductInput({ title: "실데이터 검증용 상품" });
    await createProductService(productInput);
    const product = await ProductModel.findOne({
      title: productInput.title,
    }).lean();

    const orderInput = buildOrderInput();
    const order = await createOrderService({
      ...orderInput,
      product: { ...orderInput.product, productId: product!._id.toString() },
    });
    // createdAt/confirmedAt은 timestamps 옵션으로 채워지고 immutable로 잠기므로
    // 두 보호를 모두 풀어야 한다(dashboard.integration.test.ts와 동일 패턴).
    await OrderModel.updateOne(
      { _id: order._id },
      { $set: { orderStatus: "CONFIRMED", confirmedAt: new Date() } },
      { timestamps: false, overwriteImmutable: true },
    );

    await UserModel.create(buildUserInput());

    const element = (await page()) as any;

    expect(verifySession).toHaveBeenCalledWith("ADMIN");
    expect(getDashboardStatsService).toHaveBeenCalledTimes(1);

    const stats = element.props.stats;
    expect(stats.totalProducts).toBe(1);
    expect(stats.totalUsers).toBe(1);
    expect(stats.paidOrderCountThisMonth).toBe(1);
    expect(stats.revenueThisMonth).toBe(order.finalPrice);
    expect(stats.recentOrders).toHaveLength(1);
    expect(stats.recentOrders[0].merchantUid).toBe(order.merchantUid);
  });

  it("빈 DB 상태(상태 C+D — 머지 직후 실제로 보게 될 화면, 01_ui_flow.md §5.1): 주문/상품/회원이 0건이어도 에러 없이 렌더되고 전 지표가 0·recentOrders는 빈 배열로 전달된다", async () => {
    const element = (await page()) as any;

    expect(element.props.stats).toEqual({
      totalProducts: 0,
      productsCreatedThisMonth: 0,
      totalUsers: 0,
      usersCreatedThisMonth: 0,
      revenueThisMonth: 0,
      revenuePreviousMonth: 0,
      paidOrderCountThisMonth: 0,
      paidOrderCountPreviousMonth: 0,
      recentOrders: [],
    });
  });

  it("회귀: ADMIN이 아닌 세션이면 verifySession이 거부하고 getDashboardStatsService는 호출되지 않는다", async () => {
    authState.role = "USER";

    await expect(page()).rejects.toThrow("REDIRECT:/");

    expect(verifySession).toHaveBeenCalledWith("ADMIN");
    expect(getDashboardStatsService).not.toHaveBeenCalled();
  });

  it("회귀: 미인증 세션이면 로그인 페이지로 redirect되고 getDashboardStatsService는 호출되지 않는다", async () => {
    authState.role = null;

    await expect(page()).rejects.toThrow("REDIRECT:/login");

    expect(getDashboardStatsService).not.toHaveBeenCalled();
  });
});
