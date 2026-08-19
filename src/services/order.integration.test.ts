import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/db";
import {
  buildOrderInput,
  buildProductInput,
  clearCollections,
} from "@testing/support";
import { InvitationModel, OrderModel, ProductModel } from "@/models";
import {
  createOrderService,
  getOrderSeviceByMerchantUid,
  getOrdersByUserId,
  findExpiredAwaitingInvitationOrders,
} from "./order";
import { createProductService } from "./product";

describe("order", () => {
  // REQ-5가 주문 생성 시 Product를 실제로 재조회해 수량을 검증하므로, 이 파일의
  // 기존 테스트(REQ-5와 무관하게 order 자체 로직만 보는 테스트)들도 이제 실존하는
  // Product가 있어야 통과한다 — minQuantity:1/maxQuantity:0(무제한)으로 만들어
  // 어떤 quantity를 넣어도 REQ-5 검증에 걸리지 않게 한다.
  let defaultProductId: string;

  beforeEach(async () => {
    await dbConnect();
    await clearCollections();

    const productInput = buildProductInput({
      title: "기본 주문 대상 상품",
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

  // REQ-5와 무관한 기존 테스트들이 쓰는 헬퍼 — productId를 명시적으로 override하지
  // 않으면 beforeEach에서 만든 실존 상품(무제한 수량)을 기본으로 채운다.
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

  describe("createOrderService", () => {
    it("청첩장 참조 없이 주문을 생성한다", async () => {
      const input = buildOrderInputForTest();

      const result = await createOrderService(input);

      const saved = await OrderModel.findById(result._id).lean();
      expect(saved?._id.toString()).toBe(result._id.toString());
    });

    // ── REQ-5: 클라이언트가 보낸 quantity를 신뢰하지 않고 Product를 재조회해 범위를 검증한다 ──
    describe("REQ-5 수량 범위 검증", () => {
      it("minQuantity 미만이면 VALIDATION을 던지고 주문이 생성되지 않는다", async () => {
        const productInput = buildProductInput({
          minQuantity: 3,
          maxQuantity: 10,
        });
        await createProductService(productInput);
        const product = await ProductModel.findOne({
          title: productInput.title,
        }).lean();

        const input = buildOrderInput({
          product: {
            productId: product!._id.toString(),
            title: productInput.title,
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 9900, discountedPrice: 9900 },
            quantity: 2,
            selectedFeatures: [],
          },
        });

        await expect(createOrderService(input)).rejects.toMatchObject({
          category: "VALIDATION",
          message: "이 상품은 최소 3개부터 주문할 수 있습니다.",
        });
        expect(await OrderModel.countDocuments({})).toBe(0);
      });

      it("maxQuantity 초과면 VALIDATION을 던진다", async () => {
        const productInput = buildProductInput({
          minQuantity: 1,
          maxQuantity: 5,
        });
        await createProductService(productInput);
        const product = await ProductModel.findOne({
          title: productInput.title,
        }).lean();

        const input = buildOrderInput({
          product: {
            productId: product!._id.toString(),
            title: productInput.title,
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 9900, discountedPrice: 9900 },
            quantity: 6,
            selectedFeatures: [],
          },
        });

        await expect(createOrderService(input)).rejects.toMatchObject({
          category: "VALIDATION",
          message: "이 상품은 최대 5개까지 주문할 수 있습니다.",
        });
      });

      it("maxQuantity===0(무제한)이면 상한 검증을 스킵한다", async () => {
        const productInput = buildProductInput({
          minQuantity: 1,
          maxQuantity: 0,
        });
        await createProductService(productInput);
        const product = await ProductModel.findOne({
          title: productInput.title,
        }).lean();

        const input = buildOrderInput({
          product: {
            productId: product!._id.toString(),
            title: productInput.title,
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 9900, discountedPrice: 9900 },
            quantity: 999,
            selectedFeatures: [],
          },
        });

        const result = await createOrderService(input);

        expect(result.product.quantity).toBe(999);
      });

      it("범위 안 quantity면 정상 생성된다", async () => {
        const productInput = buildProductInput({
          minQuantity: 2,
          maxQuantity: 10,
        });
        await createProductService(productInput);
        const product = await ProductModel.findOne({
          title: productInput.title,
        }).lean();

        const input = buildOrderInput({
          product: {
            productId: product!._id.toString(),
            title: productInput.title,
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 9900, discountedPrice: 9900 },
            quantity: 5,
            selectedFeatures: [],
          },
        });

        const result = await createOrderService(input);

        expect(result.product.quantity).toBe(5);
      });

      it("대상 상품이 없으면(삭제됨 포함) NOT_FOUND를 던진다", async () => {
        const missingProductId = new mongoose.Types.ObjectId().toString();
        const input = buildOrderInput({
          product: {
            productId: missingProductId,
            title: "존재하지 않는 상품",
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 9900, discountedPrice: 9900 },
            quantity: 1,
            selectedFeatures: [],
          },
        });

        await expect(createOrderService(input)).rejects.toMatchObject({
          category: "NOT_FOUND",
        });
      });

      it("minQuantity/maxQuantity 필드가 없는 레거시 상품은 (1,1) 폴백 기준으로 검증한다 (수량 1만 통과)", async () => {
        const result = await ProductModel.collection.insertOne({
          authorId: "legacy",
          title: "레거시 주문 상품",
          description: "레거시 문서(필드 없음)",
          thumbnail: "https://example.com/legacy.jpg",
          price: 1000,
          category: "invitation",
          subCategory: "wedding",
          isPremium: false,
          isFeatured: false,
          priority: 0,
          likes: [],
          views: 0,
          salesCount: 0,
          discount: { discountType: "rate", value: 0 },
          status: "active",
          featureIds: [],
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as never);
        const legacyProductId = result.insertedId.toString();

        const invalidInput = buildOrderInput({
          product: {
            productId: legacyProductId,
            title: "레거시 주문 상품",
            thumbnail: "https://example.com/legacy.jpg",
            pricing: { originalPrice: 1000, discountedPrice: 1000 },
            quantity: 2,
            selectedFeatures: [],
          },
        });
        await expect(createOrderService(invalidInput)).rejects.toMatchObject({
          category: "VALIDATION",
        });

        const validInput = buildOrderInput({
          product: {
            productId: legacyProductId,
            title: "레거시 주문 상품",
            thumbnail: "https://example.com/legacy.jpg",
            pricing: { originalPrice: 1000, discountedPrice: 1000 },
            quantity: 1,
            selectedFeatures: [],
          },
        });
        const validResult = await createOrderService(validInput);
        expect(validResult.product.quantity).toBe(1);
      });
    });

    describe("finalPrice 계산", () => {
      it("할인 없으면 상품가*수량 + 옵션가 합산이 finalPrice다", async () => {
        const input = buildOrderInput({
          discountRate: 0,
          discountAmount: 0,
          product: {
            productId: defaultProductId,
            title: "봄맞이 청첩장",
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 10000, discountedPrice: 10000 },
            quantity: 2,
            selectedFeatures: [
              {
                featureId: new mongoose.Types.ObjectId().toString(),
                code: "f1",
                label: "옵션1",
                price: 500,
              },
            ],
          },
        });

        const result = await createOrderService(input);

        expect(result.finalPrice).toBe(10000 * 2 + 500);
      });

      it("discountRate를 소계에 적용한다", async () => {
        const input = buildOrderInput({
          discountRate: 0.1,
          discountAmount: 0,
          product: {
            productId: defaultProductId,
            title: "봄맞이 청첩장",
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 10000, discountedPrice: 10000 },
            quantity: 1,
            selectedFeatures: [],
          },
        });

        const result = await createOrderService(input);

        expect(result.finalPrice).toBe(9000);
      });

      it("discountRate 적용 후 discountAmount를 추가 차감한다", async () => {
        const input = buildOrderInput({
          discountRate: 0.1,
          discountAmount: 500,
          product: {
            productId: defaultProductId,
            title: "봄맞이 청첩장",
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 10000, discountedPrice: 10000 },
            quantity: 1,
            selectedFeatures: [],
          },
        });

        const result = await createOrderService(input);

        expect(result.finalPrice).toBe(8500);
      });

      it("계산 결과가 음수면 0으로 방지한다", async () => {
        const input = buildOrderInput({
          discountRate: 0,
          discountAmount: 999999,
          product: {
            productId: defaultProductId,
            title: "봄맞이 청첩장",
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 1000, discountedPrice: 1000 },
            quantity: 1,
            selectedFeatures: [],
          },
        });

        const result = await createOrderService(input);

        expect(result.finalPrice).toBe(0);
      });

      it("소수점 결과는 내림한다", async () => {
        const input = buildOrderInput({
          discountRate: 0.15,
          discountAmount: 0,
          product: {
            productId: defaultProductId,
            title: "봄맞이 청첩장",
            thumbnail: "https://example.com/thumbnail.jpg",
            pricing: { originalPrice: 999, discountedPrice: 999 },
            quantity: 1,
            selectedFeatures: [],
          },
        });

        const result = await createOrderService(input);

        expect(result.finalPrice).toBe(Math.floor(999 * 0.85));
      });
    });
  });

  describe("findExpiredAwaitingInvitationOrders", () => {
    it("CONFIRMED + Invitation 없음 + 7일 초과면 조회된다", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const created = await createOrderService(
        buildOrderInputForTest({ userId }),
      );
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      await OrderModel.updateOne(
        { _id: created._id },
        { orderStatus: "CONFIRMED", confirmedAt: eightDaysAgo },
      );

      const result = await findExpiredAwaitingInvitationOrders(userId);

      expect(result.map((o) => o._id.toString())).toEqual([
        created._id.toString(),
      ]);
    });

    it("7일이 안 지났으면 조회되지 않는다", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const created = await createOrderService(
        buildOrderInputForTest({ userId }),
      );
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      await OrderModel.updateOne(
        { _id: created._id },
        { orderStatus: "CONFIRMED", confirmedAt: oneDayAgo },
      );

      const result = await findExpiredAwaitingInvitationOrders(userId);

      expect(result).toEqual([]);
    });

    it("Invitation이 이미 있으면 조회되지 않는다", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const created = await createOrderService(
        buildOrderInputForTest({ userId }),
      );
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      await OrderModel.updateOne(
        { _id: created._id },
        { orderStatus: "CONFIRMED", confirmedAt: eightDaysAgo },
      );
      await InvitationModel.create({
        publicKey: "existing-invitation-key",
        userId: new mongoose.Types.ObjectId(userId),
        orderId: created._id,
        productId: created.product.productId,
        status: "draft",
        groom: { name: "신랑", phone: "010-1111-2222" },
        bride: { name: "신부", phone: "010-3333-4444" },
        weddingDate: new Date("2026-12-25T13:00:00"),
        venue: "예식장",
        address: "서울시 강남구",
        addressDetail: "3층",
        guestbookEnabled: true,
        thumbnailImages: [],
        galleryImages: [],
      });

      const result = await findExpiredAwaitingInvitationOrders(userId);

      expect(result).toEqual([]);
    });

    it("CONFIRMED가 아니면(PENDING/CANCELLED 등) 조회되지 않는다", async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const created = await createOrderService(
        buildOrderInputForTest({ userId }),
      );
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      await OrderModel.updateOne(
        { _id: created._id },
        { confirmedAt: eightDaysAgo },
      );

      const result = await findExpiredAwaitingInvitationOrders(userId);

      expect(result).toEqual([]);
    });
  });

  describe("getOrderSeviceByMerchantUid", () => {
    it("존재하는 merchantUid면 주문을 리턴한다", async () => {
      const input = buildOrderInputForTest();
      const created = await createOrderService(input);

      const result = await getOrderSeviceByMerchantUid(created.merchantUid);

      expect(result?.merchantUid).toBe(created.merchantUid);
    });

    it("존재하지 않는 merchantUid면 null을 리턴한다", async () => {
      const result = await getOrderSeviceByMerchantUid("NOT-EXIST");

      expect(result).toBeNull();
    });
  });

  describe("getOrdersByUserId", () => {
    it("해당 유저의 주문 목록을 리턴한다", async () => {
      const input = buildOrderInputForTest();
      await createOrderService(input);

      const result = await getOrdersByUserId(input.userId);

      expect(result).toHaveLength(1);
    });

    it("_id를 문자열로 직렬화한다", async () => {
      const input = buildOrderInputForTest();
      const created = await createOrderService(input);

      const result = await getOrdersByUserId(input.userId);

      expect(typeof result[0]._id).toBe("string");
      expect(result[0]._id).toBe(created._id.toString());
    });
  });
});
