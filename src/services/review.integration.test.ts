import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/db";
import {
  buildOrderInput,
  buildProductInput,
  buildUserInput,
  clearCollections,
} from "@testing/support";
import type { AppError } from "@/core/domain";
import { OrderModel, ProductModel, ReviewModel, UserModel } from "@/models";
import { createProductService } from "./product";
import type * as AuthModule from "./auth";
import {
  createReviewService,
  deleteReviewByAdminService,
  deleteReviewService,
  getProductReviewsPageService,
  updateReviewService,
} from "./review";

// deleteReviewByAdminService가 자체적으로 requireAdmin()을 호출한다 — 세션
// 조회만 대체하고 나머지 auth 구현(getUser 등)은 그대로 둔다(partial mock).
vi.mock("./auth", async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return {
    ...actual,
    requireAdmin: async () => ({
      userId: "admin",
      email: "admin@example.com",
      role: "ADMIN" as const,
    }),
  };
});

describe("review", () => {
  let productId: string;

  beforeEach(async () => {
    await dbConnect();
    await clearCollections();

    const productInput = buildProductInput({ title: "리뷰 대상 상품" });
    await createProductService(productInput);
    const savedProduct = await ProductModel.findOne({
      title: productInput.title,
    }).lean();
    productId = savedProduct!._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  const createOrder = async (
    overrides: Partial<{ userId: string; orderStatus: string }> = {},
  ) => {
    const userId = overrides.userId ?? new mongoose.Types.ObjectId().toString();
    const input = buildOrderInput({ userId, product: { ...buildOrderInput().product, productId } });
    const order = await OrderModel.create({
      merchantUid: `test-${new mongoose.Types.ObjectId().toString()}`,
      userId,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone,
      product: input.product,
      finalPrice: input.product.pricing.discountedPrice,
      payMethod: input.payMethod,
      orderStatus: overrides.orderStatus ?? "COMPLETED",
    });
    return { order, userId };
  };

  describe("createReviewService", () => {
    it("완료된 주문의 소유자는 리뷰를 작성할 수 있고 상품 평점 캐시가 갱신된다", async () => {
      const { order, userId } = await createOrder();

      const review = await createReviewService({
        orderId: order._id.toString(),
        userId,
        rating: 5,
        content: "만족스러운 상품이었어요.",
        images: [],
      });

      expect(review.rating).toBe(5);
      expect(review.isOwner).toBe(true);

      const product = await ProductModel.findById(productId).lean();
      expect(product!.ratingAverage).toBe(5);
      expect(product!.ratingCount).toBe(1);
    });

    it("본인 주문이 아니면 FORBIDDEN을 던진다", async () => {
      const { order } = await createOrder();
      const otherUserId = new mongoose.Types.ObjectId().toString();

      await expect(
        createReviewService({
          orderId: order._id.toString(),
          userId: otherUserId,
          rating: 5,
          content: "내 주문이 아님",
          images: [],
        }),
      ).rejects.toMatchObject({ category: "FORBIDDEN" } satisfies Partial<AppError>);
    });

    it("주문이 COMPLETED가 아니면 VALIDATION을 던진다", async () => {
      const { order, userId } = await createOrder({ orderStatus: "CONFIRMED" });

      await expect(
        createReviewService({
          orderId: order._id.toString(),
          userId,
          rating: 5,
          content: "아직 발행 전",
          images: [],
        }),
      ).rejects.toMatchObject({ category: "VALIDATION" } satisfies Partial<AppError>);
    });

    it("같은 주문에 중복으로 작성하면 VALIDATION을 던진다", async () => {
      const { order, userId } = await createOrder();
      const input = {
        orderId: order._id.toString(),
        userId,
        rating: 4,
        content: "첫 리뷰",
        images: [] as string[],
      };
      await createReviewService(input);

      await expect(
        createReviewService({ ...input, content: "중복 시도" }),
      ).rejects.toMatchObject({ category: "VALIDATION" } satisfies Partial<AppError>);
    });
  });

  describe("updateReviewService", () => {
    it("평점을 바꾸면 상품 평점 캐시가 재계산된다", async () => {
      const { order, userId } = await createOrder();
      const review = await createReviewService({
        orderId: order._id.toString(),
        userId,
        rating: 3,
        content: "보통이에요",
        images: [],
      });

      await updateReviewService({
        reviewId: review._id,
        userId,
        rating: 1,
      });

      const product = await ProductModel.findById(productId).lean();
      expect(product!.ratingAverage).toBe(1);
    });

    it("작성자가 아니면 FORBIDDEN을 던진다", async () => {
      const { order, userId } = await createOrder();
      const review = await createReviewService({
        orderId: order._id.toString(),
        userId,
        rating: 3,
        content: "보통이에요",
        images: [],
      });

      await expect(
        updateReviewService({
          reviewId: review._id,
          userId: new mongoose.Types.ObjectId().toString(),
          content: "몰래 수정 시도",
        }),
      ).rejects.toMatchObject({ category: "FORBIDDEN" } satisfies Partial<AppError>);
    });
  });

  describe("deleteReviewService / deleteReviewByAdminService", () => {
    it("마지막 리뷰를 삭제하면 평점 캐시가 0으로 되돌아간다", async () => {
      const { order, userId } = await createOrder();
      const review = await createReviewService({
        orderId: order._id.toString(),
        userId,
        rating: 5,
        content: "삭제될 리뷰",
        images: [],
      });

      await deleteReviewService({ reviewId: review._id, userId });

      const product = await ProductModel.findById(productId).lean();
      expect(product!.ratingAverage).toBe(0);
      expect(product!.ratingCount).toBe(0);
      expect(await ReviewModel.findById(review._id).lean()).toBeNull();
    });

    it("작성자가 아니면 삭제 시 FORBIDDEN을 던진다", async () => {
      const { order, userId } = await createOrder();
      const review = await createReviewService({
        orderId: order._id.toString(),
        userId,
        rating: 5,
        content: "삭제될 리뷰",
        images: [],
      });

      await expect(
        deleteReviewService({
          reviewId: review._id,
          userId: new mongoose.Types.ObjectId().toString(),
        }),
      ).rejects.toMatchObject({ category: "FORBIDDEN" } satisfies Partial<AppError>);
    });

    it("어드민은 작성자가 아니어도 삭제할 수 있다", async () => {
      const { order, userId } = await createOrder();
      const review = await createReviewService({
        orderId: order._id.toString(),
        userId,
        rating: 5,
        content: "어드민이 지울 리뷰",
        images: [],
      });

      await deleteReviewByAdminService(review._id);

      expect(await ReviewModel.findById(review._id).lean()).toBeNull();
    });
  });

  describe("getProductReviewsPageService", () => {
    it("작성자 이름을 마스킹하고 조회자 기준 isOwner를 계산한다", async () => {
      const author = await UserModel.create(buildUserInput({ name: "김민준" }));
      const { order } = await createOrder({ userId: author._id.toString() });
      await createReviewService({
        orderId: order._id.toString(),
        userId: author._id.toString(),
        rating: 4,
        content: "마스킹 확인용",
        images: [],
      });

      const page = await getProductReviewsPageService({
        productId,
        viewerUserId: author._id.toString(),
      });

      expect(page.items).toHaveLength(1);
      expect(page.items[0].authorName).toBe("김*준");
      expect(page.items[0].isOwner).toBe(true);
    });

    it("RATING_HIGH 정렬은 평점 높은 순으로 반환한다", async () => {
      const ratings = [2, 5, 3];
      for (const rating of ratings) {
        const { order, userId } = await createOrder();
        await createReviewService({
          orderId: order._id.toString(),
          userId,
          rating,
          content: `평점 ${rating}`,
          images: [],
        });
      }

      const page = await getProductReviewsPageService({
        productId,
        sort: "RATING_HIGH",
      });

      expect(page.items.map((item) => item.rating)).toEqual([5, 3, 2]);
    });

    it("limit보다 리뷰가 많으면 nextCursor를 반환하고 더보기로 나머지를 가져온다", async () => {
      for (let i = 0; i < 3; i += 1) {
        const { order, userId } = await createOrder();
        await createReviewService({
          orderId: order._id.toString(),
          userId,
          rating: 5,
          content: `리뷰 ${i}`,
          images: [],
        });
      }

      const firstPage = await getProductReviewsPageService({
        productId,
        limit: 2,
      });
      expect(firstPage.items).toHaveLength(2);
      expect(firstPage.nextCursor).not.toBeNull();

      const secondPage = await getProductReviewsPageService({
        productId,
        limit: 2,
        cursor: firstPage.nextCursor!,
      });
      expect(secondPage.items).toHaveLength(1);
      expect(secondPage.nextCursor).toBeNull();
    });
  });
});
