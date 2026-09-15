import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/db/connect";
import {
  buildFeatureInput,
  buildFeatureDocumentInput,
  buildProductInput,
  clearCollections,
} from "@test/support";
import { FeatureModel } from "@/models/feature.model";
import { ProductModel } from "@/models/product.model";
import { createPremiumFeatureService } from "@/services/premiumFeature";
import {
  attachPremiumFeatureToProductService,
  createProductService,
  deleteProductService,
  detachPremiumFeatureFromProductService,
  getFeatureProductBindingsPageService,
} from "@/services/product";

const createProduct = async (
  title: string,
  overrides?: Parameters<typeof buildProductInput>[0],
) => {
  await createProductService(buildProductInput({ title, ...overrides }));
  const product = await ProductModel.findOne({ title }).lean<{
    _id: mongoose.Types.ObjectId;
  }>();
  return String(product!._id);
};

describe("featureProductBinding", () => {
  let featureId: string;

  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
    const feature = await createPremiumFeatureService(buildFeatureInput());
    featureId = String(feature._id);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("getFeatureProductBindingsPageService", () => {
    it("프리미엄 상품만 리턴한다", async () => {
      await createProduct("프리미엄 청첩장", {
        isPremium: true,
        featureIds: [featureId],
      });
      await createProduct("일반 청첩장", { isPremium: false });

      const page = await getFeatureProductBindingsPageService({ featureId });

      expect(page.items.map((item) => item.title)).toEqual(["프리미엄 청첩장"]);
    });

    it("휴지통에 있는 상품은 제외한다", async () => {
      const productId = await createProduct("삭제될 청첩장", {
        isPremium: true,
        featureIds: [featureId],
      });
      await deleteProductService(productId);

      const page = await getFeatureProductBindingsPageService({ featureId });

      expect(page.items).toEqual([]);
    });

    it("이 기능을 쓰는 상품은 attached로 표시한다", async () => {
      await createProduct("붙은 청첩장", {
        isPremium: true,
        featureIds: [featureId],
      });
      const other = await FeatureModel.create(
        buildFeatureDocumentInput({ code: "OTHER" }),
      );
      await createProduct("안 붙은 청첩장", {
        isPremium: true,
        featureIds: [String(other._id)],
      });

      const page = await getFeatureProductBindingsPageService({ featureId });

      expect(
        Object.fromEntries(
          page.items.map((item) => [item.title, item.attached]),
        ),
      ).toEqual({ "붙은 청첩장": true, "안 붙은 청첩장": false });
    });

    it("검색어로 상품명을 부분일치 조회한다", async () => {
      await createProduct("봄맞이 청첩장", {
        isPremium: true,
        featureIds: [featureId],
      });
      await createProduct("겨울 청첩장", {
        isPremium: true,
        featureIds: [featureId],
      });

      const page = await getFeatureProductBindingsPageService({
        featureId,
        q: "봄맞이",
      });

      expect(page.items.map((item) => item.title)).toEqual(["봄맞이 청첩장"]);
    });

    it("검색어 대소문자를 무시한다", async () => {
      await createProduct("Spring Invitation", {
        isPremium: true,
        featureIds: [featureId],
      });

      const page = await getFeatureProductBindingsPageService({
        featureId,
        q: "spring",
      });

      expect(page.items).toHaveLength(1);
    });

    // 정규식 특수문자가 그대로 들어가면 쿼리가 깨지거나 의도치 않게 매칭된다.
    it("정규식 특수문자를 글자 그대로 찾는다", async () => {
      await createProduct("청첩장 (봄)", {
        isPremium: true,
        featureIds: [featureId],
      });
      await createProduct("청첩장 봄", {
        isPremium: true,
        featureIds: [featureId],
      });

      const page = await getFeatureProductBindingsPageService({
        featureId,
        q: "(봄)",
      });

      expect(page.items.map((item) => item.title)).toEqual(["청첩장 (봄)"]);
    });

    it("커서로 다음 페이지를 이어서 준다", async () => {
      for (let i = 0; i < 3; i += 1) {
        await createProduct(`청첩장 ${i}`, {
          isPremium: true,
          featureIds: [featureId],
        });
      }

      const first = await getFeatureProductBindingsPageService({
        featureId,
        limit: 2,
      });
      expect(first.items).toHaveLength(2);
      expect(first.nextCursor).not.toBeNull();

      const second = await getFeatureProductBindingsPageService({
        featureId,
        limit: 2,
        cursor: first.nextCursor!,
      });

      expect(second.items).toHaveLength(1);
      expect(second.nextCursor).toBeNull();
      const titles = [...first.items, ...second.items].map((i) => i.title);
      expect(new Set(titles).size).toBe(3);
    });

    it("형식이 깨진 커서면 VALIDATION을 던진다", async () => {
      await expect(
        getFeatureProductBindingsPageService({
          featureId,
          cursor: "!!!broken!!!",
        }),
      ).rejects.toMatchObject({ category: "VALIDATION" });
    });
  });

  describe("attachPremiumFeatureToProductService", () => {
    it("상품의 featureIds에 기능을 추가한다", async () => {
      const other = await FeatureModel.create(
        buildFeatureDocumentInput({ code: "OTHER" }),
      );
      const productId = await createProduct("봄맞이 청첩장", {
        isPremium: true,
        featureIds: [String(other._id)],
      });

      await attachPremiumFeatureToProductService(productId, featureId);

      const saved = await ProductModel.findById(productId).lean();
      expect(saved?.featureIds?.map(String)).toContain(featureId);
    });

    it("이미 붙어 있으면 중복으로 넣지 않는다", async () => {
      const productId = await createProduct("봄맞이 청첩장", {
        isPremium: true,
        featureIds: [featureId],
      });

      await attachPremiumFeatureToProductService(productId, featureId);

      const saved = await ProductModel.findById(productId).lean();
      expect(saved?.featureIds).toHaveLength(1);
    });

    // isPremium이 false면 서비스가 featureIds를 비우므로, 붙여도 조용히 사라진다.
    it("프리미엄 상품이 아니면 VALIDATION을 던진다", async () => {
      const productId = await createProduct("일반 청첩장", {
        isPremium: false,
      });

      await expect(
        attachPremiumFeatureToProductService(productId, featureId),
      ).rejects.toMatchObject({ category: "VALIDATION" });
    });

    it("휴지통에 있는 상품이면 NOT_FOUND를 던진다", async () => {
      const productId = await createProduct("삭제될 청첩장", {
        isPremium: true,
        featureIds: [featureId],
      });
      await deleteProductService(productId);

      await expect(
        attachPremiumFeatureToProductService(productId, featureId),
      ).rejects.toMatchObject({ category: "NOT_FOUND" });
    });

    it("존재하지 않는 기능이면 NOT_FOUND를 던진다", async () => {
      const productId = await createProduct("봄맞이 청첩장", {
        isPremium: true,
        featureIds: [featureId],
      });
      const missingFeatureId = new mongoose.Types.ObjectId().toString();

      await expect(
        attachPremiumFeatureToProductService(productId, missingFeatureId),
      ).rejects.toMatchObject({ category: "NOT_FOUND" });
    });
  });

  describe("detachPremiumFeatureFromProductService", () => {
    it("상품의 featureIds에서 기능을 뺀다", async () => {
      const other = await FeatureModel.create(
        buildFeatureDocumentInput({ code: "OTHER" }),
      );
      const productId = await createProduct("봄맞이 청첩장", {
        isPremium: true,
        featureIds: [featureId, String(other._id)],
      });

      await detachPremiumFeatureFromProductService(productId, featureId);

      const saved = await ProductModel.findById(productId).lean();
      expect(saved?.featureIds?.map(String)).toEqual([String(other._id)]);
    });

    // 마지막 기능을 빼면 isPremium인데 featureIds가 비어 product.schema의 refine을
    // 통과하지 못해 그 상품은 이후 수정 저장이 전부 막힌다.
    it("마지막 기능이면 차단하고 그대로 둔다", async () => {
      const productId = await createProduct("봄맞이 청첩장", {
        isPremium: true,
        featureIds: [featureId],
      });

      await expect(
        detachPremiumFeatureFromProductService(productId, featureId),
      ).rejects.toMatchObject({ category: "VALIDATION" });

      const saved = await ProductModel.findById(productId).lean();
      expect(saved?.featureIds?.map(String)).toEqual([featureId]);
    });

    it("차단 메시지에 상품명을 담는다", async () => {
      const productId = await createProduct("봄맞이 청첩장", {
        isPremium: true,
        featureIds: [featureId],
      });

      await expect(
        detachPremiumFeatureFromProductService(productId, featureId),
      ).rejects.toMatchObject({
        message: expect.stringContaining("봄맞이 청첩장"),
      });
    });

    it("존재하지 않는 상품이면 NOT_FOUND를 던진다", async () => {
      const missingProductId = new mongoose.Types.ObjectId().toString();

      await expect(
        detachPremiumFeatureFromProductService(missingProductId, featureId),
      ).rejects.toMatchObject({ category: "NOT_FOUND" });
    });
  });
});
