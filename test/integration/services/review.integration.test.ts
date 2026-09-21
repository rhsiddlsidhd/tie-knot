import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/db/connect";
import {
  buildOrderInput,
  buildProductInput,
  buildUserInput,
  clearCollections,
} from "@test/support";
import type { AppError } from "@/core/domain/error";
import { OrderModel } from "@/models/order.model";
import { ProductModel } from "@/models/product.model";
import { ReviewModel } from "@/models/review.model";
import { UserModel } from "@/models/user.model";
import { createProductService } from "@/services/product";
import type * as AuthModule from "@/services/auth";
import {
  createReviewService,
  deleteReviewByAdminService,
  deleteReviewService,
  getAdminReviewsPageService,
  getProductReviewsPageService,
  updateReviewService,
} from "@/services/review";

// deleteReviewByAdminService가 자체적으로 requireAdmin()을 호출한다 — 세션
// 조회만 대체하고 나머지 auth 구현(getUser 등)은 그대로 둔다(partial mock).
vi.mock("@/services/auth", async (importOriginal) => {
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
    const input = buildOrderInput({
      userId,
      product: { ...buildOrderInput().product, productId },
    });
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
      ).rejects.toMatchObject({
        category: "FORBIDDEN",
      } satisfies Partial<AppError>);
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
      ).rejects.toMatchObject({
        category: "VALIDATION",
      } satisfies Partial<AppError>);
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
      ).rejects.toMatchObject({
        category: "VALIDATION",
      } satisfies Partial<AppError>);
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
      ).rejects.toMatchObject({
        category: "FORBIDDEN",
      } satisfies Partial<AppError>);
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
      ).rejects.toMatchObject({
        category: "FORBIDDEN",
      } satisfies Partial<AppError>);
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

  describe("getAdminReviewsPageService", () => {
    const createReviewFixture = async (overrides?: {
      userInput?: Parameters<typeof buildUserInput>[0];
      productInput?: Parameters<typeof buildProductInput>[0];
      rating?: number;
      content?: string;
    }) => {
      const user = await UserModel.create(buildUserInput(overrides?.userInput));
      await createProductService(buildProductInput(overrides?.productInput));
      const product = await ProductModel.findOne({
        title: overrides?.productInput?.title ?? "테스트 샘플 상품",
      }).lean<{ _id: mongoose.Types.ObjectId }>();

      return ReviewModel.create({
        productId: product!._id,
        userId: user._id,
        orderId: new mongoose.Types.ObjectId(),
        rating: overrides?.rating ?? 5,
        content: overrides?.content ?? "만족스러운 상품입니다.",
      });
    };

    it("검색 조건이 없으면 createdAt 내림차순으로 전체를 리턴한다", async () => {
      await createReviewFixture({ productInput: { title: "상품A" } });
      await createReviewFixture({ productInput: { title: "상품B" } });

      const result = await getAdminReviewsPageService({});

      expect(result.items).toHaveLength(2);
    });

    it("작성자 이메일 부분일치로 찾는다", async () => {
      await createReviewFixture({
        userInput: { email: "chulsoo@example.com" },
      });
      await createReviewFixture({
        userInput: { email: "younghee@example.com" },
      });

      const result = await getAdminReviewsPageService({ q: "chulsoo" });

      expect(result.items).toHaveLength(1);
    });

    it("상품명 부분일치로 찾는다", async () => {
      await createReviewFixture({ productInput: { title: "봄맞이 한정판" } });
      await createReviewFixture({ productInput: { title: "가을 신상품" } });

      const result = await getAdminReviewsPageService({ q: "봄맞이" });

      expect(result.items.map((r) => r.productTitle)).toEqual([
        "봄맞이 한정판",
      ]);
    });

    it("작성자 이메일과 상품명 중 어느 쪽에 걸려도 찾는다", async () => {
      await createReviewFixture({
        userInput: { email: "match@example.com" },
        productInput: { title: "무관한 상품" },
      });
      await createReviewFixture({
        userInput: { email: "unrelated@example.com" },
        productInput: { title: "match 상품" },
      });
      await createReviewFixture({
        userInput: { email: "unrelated2@example.com" },
        productInput: { title: "무관한 상품2" },
      });

      const result = await getAdminReviewsPageService({ q: "match" });

      expect(result.items).toHaveLength(2);
    });

    it("대소문자를 무시한다", async () => {
      await createReviewFixture({
        userInput: { email: "ChulSoo@example.com" },
      });

      const result = await getAdminReviewsPageService({ q: "chulsoo" });

      expect(result.items).toHaveLength(1);
    });

    it("정규식 특수문자를 글자 그대로 찾는다", async () => {
      await createReviewFixture({ productInput: { title: "청첩장 (한정판)" } });
      await createReviewFixture({ productInput: { title: "청첩장 한정판" } });

      const result = await getAdminReviewsPageService({ q: "(한정판)" });

      expect(result.items.map((r) => r.productTitle)).toEqual([
        "청첩장 (한정판)",
      ]);
    });

    it("조건에 맞는 리뷰가 없으면 빈 배열을 리턴한다", async () => {
      await createReviewFixture({});

      const result = await getAdminReviewsPageService({ q: "없는사람" });

      expect(result.items).toEqual([]);
    });

    it("검색어와 커서를 함께 적용한다", async () => {
      for (let i = 0; i < 3; i += 1) {
        await createReviewFixture({
          userInput: { email: `match${i}@example.com` },
        });
      }
      await createReviewFixture({
        userInput: { email: "unrelated@example.com" },
      });

      const first = await getAdminReviewsPageService({ q: "match", limit: 2 });
      expect(first.items).toHaveLength(2);
      expect(first.nextCursor).not.toBeNull();

      const second = await getAdminReviewsPageService({
        q: "match",
        limit: 2,
        cursor: first.nextCursor!,
      });

      expect(second.items).toHaveLength(1);
      expect(second.nextCursor).toBeNull();
    });

    it("형식이 깨진 커서면 VALIDATION을 던진다", async () => {
      await expect(
        getAdminReviewsPageService({ cursor: "!!!broken!!!" }),
      ).rejects.toMatchObject({ category: "VALIDATION" });
    });
  });
});
