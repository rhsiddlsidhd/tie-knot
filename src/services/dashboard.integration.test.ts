import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/db";
import {
  buildOrderInput,
  buildProductInput,
  buildUserInput,
  clearCollections,
} from "@testing/support";
import { getKstMonthRange } from "@/core/utils";
import { OrderModel, ProductModel, UserModel } from "@/models";
import { createOrderService } from "./order";
import { createProductService } from "./product";
import { getDashboardStatsService } from "./dashboard";

describe("getDashboardStatsService", () => {
  let defaultProductId: string;
  // 이번 달/전월(KST) 경계 안쪽 임의 시각 — 실제 서비스도 같은 getKstMonthRange()를
  // 호출하므로 테스트 시각과 몇 ms 차이가 나도 같은 버킷으로 떨어진다.
  let thisMonth: Date;
  let previousMonth: Date;
  let outsideRange: Date;

  beforeEach(async () => {
    await dbConnect();
    await clearCollections();

    const { startOfThisMonth, startOfLastMonth } = getKstMonthRange();
    thisMonth = new Date(startOfThisMonth.getTime() + 60 * 60 * 1000);
    previousMonth = new Date(startOfLastMonth.getTime() + 60 * 60 * 1000);
    outsideRange = new Date(startOfLastMonth.getTime() - 24 * 60 * 60 * 1000);

    // REQ-5(수량 범위 검증)를 만족시키기 위한 기본 주문 대상 상품 — 이 상품 자체가
    // "이번 달 등록"이라 총 상품/이번달 신규 상품 어서션의 베이스라인이 된다.
    const productInput = buildProductInput({
      title: "대시보드 테스트 기본 상품",
      minQuantity: 1,
      maxQuantity: 0,
    });
    await createProductService(productInput);
    const savedProduct = await ProductModel.findOne({
      title: productInput.title,
    }).lean();
    defaultProductId = savedProduct!._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const buildOrderInputForTest = (
    overrides?: Parameters<typeof buildOrderInput>[0],
  ): ReturnType<typeof buildOrderInput> => {
    const input = buildOrderInput(overrides);
    return {
      ...input,
      product: {
        ...input.product,
        productId: overrides?.product?.productId ?? defaultProductId,
      },
    };
  };

  // createdAt은 timestamps 옵션으로 자동 채워지고 immutable로 잠기므로, 월 버킷을
  // 임의로 옮기려면 두 보호를 모두 풀어야 한다(order.integration.test.ts와 동일 패턴).
  const setOrderTiming = async (
    orderId: mongoose.Types.ObjectId,
    fields: Partial<{
      orderStatus: string;
      confirmedAt: Date;
      createdAt: Date;
    }>,
  ) => {
    await OrderModel.updateOne(
      { _id: orderId },
      { $set: fields },
      { timestamps: false, overwriteImmutable: true },
    );
  };

  describe("빈 상태(REQ-2)", () => {
    it("주문/추가 상품/회원이 없으면 유량 지표는 전부 0이고 recentOrders는 빈 배열이다", async () => {
      const result = await getDashboardStatsService();

      // beforeEach가 만든 기본 상품 1개만 존재하는 상태
      expect(result.totalProducts).toBe(1);
      expect(result.totalUsers).toBe(0);
      expect(result.usersCreatedThisMonth).toBe(0);
      expect(result.revenueThisMonth).toBe(0);
      expect(result.revenuePreviousMonth).toBe(0);
      expect(result.paidOrderCountThisMonth).toBe(0);
      expect(result.paidOrderCountPreviousMonth).toBe(0);
      expect(result.recentOrders).toEqual([]);
    });
  });

  describe("상품/회원 저량 지표", () => {
    it("소프트 삭제된 상품은 totalProducts에서 제외된다", async () => {
      const deletedInput = buildProductInput({ title: "삭제된 상품" });
      await createProductService(deletedInput);
      await ProductModel.updateOne(
        { title: deletedInput.title },
        { $set: { deletedAt: new Date(), status: "deleted" } },
      );

      const result = await getDashboardStatsService();

      expect(result.totalProducts).toBe(1); // beforeEach의 기본 상품만
    });

    it("이번 달(KST) 등록 상품만 productsCreatedThisMonth에 잡힌다", async () => {
      const oldInput = buildProductInput({ title: "지난 달 등록 상품" });
      await createProductService(oldInput);
      await ProductModel.updateOne(
        { title: oldInput.title },
        { $set: { createdAt: previousMonth } },
        { timestamps: false, overwriteImmutable: true },
      );

      const result = await getDashboardStatsService();

      expect(result.totalProducts).toBe(2); // 기본 상품 + 지난달 상품
      expect(result.productsCreatedThisMonth).toBe(1); // 기본 상품(방금 생성=이번달)만
    });

    it("탈퇴 회원은 totalUsers에서 제외되고, 이번 달 가입만 usersCreatedThisMonth에 잡힌다", async () => {
      await UserModel.create(
        buildUserInput({ email: "active-this-month@example.com" }),
      );
      await UserModel.create(
        buildUserInput({ email: "deleted@example.com", isDelete: true }),
      );
      const oldUser = await UserModel.create(
        buildUserInput({ email: "old@example.com" }),
      );
      await UserModel.updateOne(
        { _id: oldUser._id },
        { $set: { createdAt: previousMonth } },
        { timestamps: false, overwriteImmutable: true },
      );

      const result = await getDashboardStatsService();

      expect(result.totalUsers).toBe(2); // active-this-month + old (탈퇴 제외)
      expect(result.usersCreatedThisMonth).toBe(1); // active-this-month만
    });
  });

  describe("매출/결제 주문", () => {
    it("CONFIRMED/COMPLETED만 집계되고 PENDING/CANCELLED는 제외된다", async () => {
      const confirmed = await createOrderService(buildOrderInputForTest());
      await setOrderTiming(confirmed._id, {
        orderStatus: "CONFIRMED",
        confirmedAt: thisMonth,
      });

      const completed = await createOrderService(buildOrderInputForTest());
      await setOrderTiming(completed._id, {
        orderStatus: "COMPLETED",
        confirmedAt: thisMonth,
      });

      // PENDING — confirmedAt이 아예 없으므로 $match에서 자연히 제외된다.
      await createOrderService(buildOrderInputForTest());

      const cancelled = await createOrderService(buildOrderInputForTest());
      await setOrderTiming(cancelled._id, {
        orderStatus: "CANCELLED",
        confirmedAt: thisMonth,
      });

      const result = await getDashboardStatsService();

      expect(result.paidOrderCountThisMonth).toBe(2);
      expect(result.revenueThisMonth).toBe(
        confirmed.finalPrice + completed.finalPrice,
      );
    });

    it("confirmedAt이 이번 달이면 thisMonth, 전월이면 previousMonth 버킷에 집계된다", async () => {
      const current = await createOrderService(buildOrderInputForTest());
      await setOrderTiming(current._id, {
        orderStatus: "CONFIRMED",
        confirmedAt: thisMonth,
      });

      const prev = await createOrderService(buildOrderInputForTest());
      await setOrderTiming(prev._id, {
        orderStatus: "CONFIRMED",
        confirmedAt: previousMonth,
      });

      const result = await getDashboardStatsService();

      expect(result.paidOrderCountThisMonth).toBe(1);
      expect(result.revenueThisMonth).toBe(current.finalPrice);
      expect(result.paidOrderCountPreviousMonth).toBe(1);
      expect(result.revenuePreviousMonth).toBe(prev.finalPrice);
    });

    it("전전월처럼 범위 밖 confirmedAt은 집계에서 완전히 빠진다", async () => {
      const outside = await createOrderService(buildOrderInputForTest());
      await setOrderTiming(outside._id, {
        orderStatus: "CONFIRMED",
        confirmedAt: outsideRange,
      });

      const result = await getDashboardStatsService();

      expect(result.paidOrderCountThisMonth).toBe(0);
      expect(result.paidOrderCountPreviousMonth).toBe(0);
      expect(result.revenueThisMonth).toBe(0);
      expect(result.revenuePreviousMonth).toBe(0);
    });

    it("전월 실적이 없으면 0을 반환한다(undefined 아님)", async () => {
      const current = await createOrderService(buildOrderInputForTest());
      await setOrderTiming(current._id, {
        orderStatus: "CONFIRMED",
        confirmedAt: thisMonth,
      });

      const result = await getDashboardStatsService();

      expect(result.revenuePreviousMonth).toBe(0);
      expect(result.paidOrderCountPreviousMonth).toBe(0);
    });
  });

  describe("recentOrders", () => {
    it("createdAt desc로 최대 5건만 반환하고 상태 필터가 없다(PENDING 포함)", async () => {
      const created: { merchantUid: string; createdAt: Date }[] = [];
      for (let i = 0; i < 6; i += 1) {
        const order = await createOrderService(buildOrderInputForTest());
        const createdAt = new Date(Date.now() - (6 - i) * 60 * 1000);
        await setOrderTiming(order._id, { createdAt });
        created.push({ merchantUid: order.merchantUid, createdAt });
      }
      // 마지막(가장 최근) 주문은 orderStatus를 안 건드려 기본값 PENDING 그대로다.

      const result = await getDashboardStatsService();

      expect(result.recentOrders).toHaveLength(5);
      const expectedMerchantUids = created
        .slice()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
        .map((o) => o.merchantUid);
      expect(result.recentOrders.map((o) => o.merchantUid)).toEqual(
        expectedMerchantUids,
      );
      expect(
        result.recentOrders.some((o) => o.orderStatus === "PENDING"),
      ).toBe(true);
    });

    it("productTitle이 product.title 스냅샷으로 평탄화되고 createdAt이 Date 인스턴스로 온다", async () => {
      const order = await createOrderService(
        buildOrderInputForTest({
          product: {
            productId: defaultProductId,
            title: "스냅샷 확인용 상품명",
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 9900, discountedPrice: 9900 },
            quantity: 1,
            selectedFeatures: [],
          },
        }),
      );

      const result = await getDashboardStatsService();

      const row = result.recentOrders.find(
        (o) => o.merchantUid === order.merchantUid,
      );
      expect(row?.productTitle).toBe("스냅샷 확인용 상품명");
      expect(row?.createdAt).toBeInstanceOf(Date);
      expect(row?.finalPrice).toBe(order.finalPrice);
      expect(row?.buyerName).toBe(order.buyerName);
    });
  });

  describe("에러 계약", () => {
    it("mongoose 예외가 나면 raw 에러가 아니라 AppError(INTERNAL)로 감싸 던진다", async () => {
      const aggregateSpy = vi
        .spyOn(OrderModel, "aggregate")
        .mockRejectedValueOnce(new Error("DB 커넥션 끊김"));

      await expect(getDashboardStatsService()).rejects.toMatchObject({
        category: "INTERNAL",
        message: "DB 커넥션 끊김",
      });

      aggregateSpy.mockRestore();
    });
  });
});
