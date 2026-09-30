import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/db/connect";
import {
  buildFeatureDocumentInput,
  buildFeatureInput,
  buildOrderInput,
  buildProductInput,
  clearCollections,
} from "@test/support";
import { FeatureModel } from "@/models/feature.model";
import { OrderModel } from "@/models/order.model";
import { ProductModel } from "@/models/product.model";
import {
  createPremiumFeatureService,
  deletePremiumFeatureService,
  getAdminPremiumFeaturesPageService,
  getAllPremiumFeatureService,
  getSelectablePremiumFeatureService,
  getPremiumFeatureService,
  updatePremiumFeatureService,
} from "@/services/premiumFeature";
import { createProductService, deleteProductService } from "@/services/product";
import { createOrderService } from "@/services/order";

describe("premiumFeature", () => {
  beforeEach(async () => {
    await dbConnect();
    await clearCollections();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("createPremiumFeatureService", () => {
    it("정상 데이터로 프리미엄 기능을 생성한다", async () => {
      const input = buildFeatureInput();

      const created = await createPremiumFeatureService(input);

      expect(created.code).toBe(input.code);
      const saved = await FeatureModel.findOne({ code: input.code }).lean();
      expect(saved).not.toBeNull();
    });
  });

  describe("getAllPremiumFeatureService", () => {
    it("FeatureDocument 기반으로 매핑된 PremiumFeature 목록을 리턴한다", async () => {
      await FeatureModel.create(
        buildFeatureDocumentInput({ code: "GUESTBOOK" }),
      );
      await FeatureModel.create(
        buildFeatureDocumentInput({
          code: "MAP",
          label: "지도",
          description: "오시는 길 지도를 추가합니다.",
        }),
      );

      const result = await getAllPremiumFeatureService();

      expect(result).toHaveLength(2);
      expect(result.map((f) => f.code).sort()).toEqual(["GUESTBOOK", "MAP"]);
      expect(typeof result[0]._id).toBe("string");
      expect(typeof result[0].createdAt).toBe("string");
    });

    it("description이 없으면 빈 문자열로 매핑한다", async () => {
      await FeatureModel.create({
        code: "NO_DESC",
        label: "설명없음",
        additionalPrice: 1000,
      });

      const result = await getAllPremiumFeatureService();

      expect(result[0].description).toBe("");
    });
  });

  describe("getPremiumFeatureService", () => {
    it("빈 배열을 받으면 DB 조회 없이 빈 배열을 리턴한다", async () => {
      const result = await getPremiumFeatureService([]);

      expect(result).toEqual([]);
    });

    it("id 목록에 해당하는 기능만 리턴한다", async () => {
      const created = await createPremiumFeatureService(buildFeatureInput());
      await FeatureModel.create(
        buildFeatureDocumentInput({
          code: "OTHER",
          label: "다른기능",
          description: "다른 기능 설명입니다.",
        }),
      );

      const result = await getPremiumFeatureService([String(created._id)]);

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe(created.code);
    });
  });

  describe("updatePremiumFeatureService", () => {
    it("정상 수정하면 갱신된 문서를 리턴한다", async () => {
      const created = await createPremiumFeatureService(buildFeatureInput());

      const updated = await updatePremiumFeatureService(String(created._id), {
        ...buildFeatureInput(),
        label: "수정된 라벨",
      });

      expect(updated?.label).toBe("수정된 라벨");
    });

    it("존재하지 않는 id면 null을 리턴한다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const result = await updatePremiumFeatureService(
        missingId,
        buildFeatureInput(),
      );

      expect(result).toBeNull();
    });
  });

  describe("getAdminPremiumFeaturesPageService", () => {
    // createdAt은 timestamps가 자동으로 채우고 immutable로 잠그므로, 순서 검증을
    // 위해 덮어쓰려면 두 보호를 모두 풀어야 한다(user.integration.test.ts와 동일 패턴).
    const setCreatedAt = async (
      featureId: mongoose.Types.ObjectId,
      createdAt: Date,
    ) => {
      await FeatureModel.updateOne(
        { _id: featureId },
        { $set: { createdAt } },
        { timestamps: false, overwriteImmutable: true },
      );
    };

    const createFeatures = async (count: number) => {
      const ids: string[] = [];
      for (let i = 0; i < count; i += 1) {
        const feature = await FeatureModel.create(
          buildFeatureDocumentInput({ code: `FEATURE_${i}` }),
        );
        await setCreatedAt(feature._id, new Date(2026, 0, i + 1));
        ids.push(feature._id.toString());
      }
      return ids;
    };

    it("createdAt 내림차순으로 정렬한다", async () => {
      const [older, newer] = await createFeatures(2);

      const result = await getAdminPremiumFeaturesPageService({});

      expect(result.items.map((feature) => feature._id)).toEqual([
        newer,
        older,
      ]);
    });

    it("offset 페이지가 total과 totalPages를 반환하고 행이 중복/누락되지 않는다", async () => {
      const created = await createFeatures(3);

      const firstPage = await getAdminPremiumFeaturesPageService({
        limit: 2,
        page: 1,
      });
      expect(firstPage.items).toHaveLength(2);
      expect(firstPage).toMatchObject({
        total: 3,
        page: 1,
        limit: 2,
        totalPages: 2,
      });

      const secondPage = await getAdminPremiumFeaturesPageService({
        limit: 2,
        page: 2,
      });
      expect(secondPage.items).toHaveLength(1);
      expect(secondPage.totalPages).toBe(2);

      const paged = [...firstPage.items, ...secondPage.items].map(
        (feature) => feature._id,
      );
      expect(new Set(paged).size).toBe(3);
      expect(paged.sort()).toEqual([...created].sort());
    });

    it("범위를 벗어난 page는 빈 페이지와 전체 건수를 반환한다", async () => {
      await createFeatures(1);
      const result = await getAdminPremiumFeaturesPageService({ page: 2 });
      expect(result.items).toEqual([]);
      expect(result).toMatchObject({ total: 1, page: 2, totalPages: 1 });
    });

    it("limit이 허용 범위를 벗어나면 VALIDATION을 던진다", async () => {
      await expect(
        getAdminPremiumFeaturesPageService({ limit: 0 }),
      ).rejects.toMatchObject({ category: "VALIDATION" });
    });

    it("status=active면 활성 기능만, status=inactive면 비활성 기능만 좁힌다", async () => {
      const active = await FeatureModel.create(
        buildFeatureDocumentInput({ code: "ACTIVE_1", isActive: true }),
      );
      const inactive = await FeatureModel.create(
        buildFeatureDocumentInput({ code: "INACTIVE_1", isActive: false }),
      );

      const activeResult = await getAdminPremiumFeaturesPageService({
        status: "active",
      });
      const inactiveResult = await getAdminPremiumFeaturesPageService({
        status: "inactive",
      });

      expect(activeResult.items.map((f) => f._id)).toEqual([
        active._id.toString(),
      ]);
      expect(inactiveResult.items.map((f) => f._id)).toEqual([
        inactive._id.toString(),
      ]);
    });

    it.each(["createdAt", "label", "additionalPrice"] as const)(
      "%s를 양방향 정렬한다",
      async (sort) => {
        const first = await FeatureModel.create(
          buildFeatureDocumentInput({
            code: "SORT_A",
            label: "가",
            additionalPrice: 1000,
          }),
        );
        const second = await FeatureModel.create(
          buildFeatureDocumentInput({
            code: "SORT_B",
            label: "나",
            additionalPrice: 2000,
          }),
        );
        if (sort === "createdAt") {
          await setCreatedAt(first._id, new Date("2026-01-01"));
          await setCreatedAt(second._id, new Date("2026-02-01"));
        }
        const asc = await getAdminPremiumFeaturesPageService({
          sort,
          direction: "asc",
        });
        const desc = await getAdminPremiumFeaturesPageService({
          sort,
          direction: "desc",
        });
        expect(asc.items.map((item) => item._id)).toEqual([
          first._id.toString(),
          second._id.toString(),
        ]);
        expect(desc.items.map((item) => item._id)).toEqual([
          second._id.toString(),
          first._id.toString(),
        ]);
      },
    );

    describe("검색(q)", () => {
      it("code 부분일치로 찾는다", async () => {
        await FeatureModel.create(
          buildFeatureDocumentInput({ code: "GUESTBOOK", label: "방명록" }),
        );
        await FeatureModel.create(
          buildFeatureDocumentInput({ code: "MAP", label: "지도" }),
        );

        const result = await getAdminPremiumFeaturesPageService({
          q: "GUEST",
        });

        expect(result.items.map((f) => f.code)).toEqual(["GUESTBOOK"]);
      });

      it("label 부분일치로 찾는다", async () => {
        await FeatureModel.create(
          buildFeatureDocumentInput({ code: "GUESTBOOK", label: "방명록" }),
        );
        await FeatureModel.create(
          buildFeatureDocumentInput({ code: "MAP", label: "지도" }),
        );

        const result = await getAdminPremiumFeaturesPageService({
          q: "방명",
        });

        expect(result.items.map((f) => f.code)).toEqual(["GUESTBOOK"]);
      });

      it("대소문자를 무시한다", async () => {
        await FeatureModel.create(
          buildFeatureDocumentInput({ code: "GUESTBOOK", label: "방명록" }),
        );

        const result = await getAdminPremiumFeaturesPageService({
          q: "guestbook",
        });

        expect(result.items).toHaveLength(1);
      });

      it("정규식 특수문자를 글자 그대로 찾는다", async () => {
        await FeatureModel.create(
          buildFeatureDocumentInput({
            code: "MAP_V2",
            label: "지도(구버전)",
          }),
        );
        await FeatureModel.create(
          buildFeatureDocumentInput({ code: "MAP_V3", label: "지도" }),
        );

        const result = await getAdminPremiumFeaturesPageService({
          q: "(구버전)",
        });

        expect(result.items.map((f) => f.code)).toEqual(["MAP_V2"]);
      });

      it("조건에 맞는 기능이 없으면 빈 배열을 리턴한다", async () => {
        await FeatureModel.create(
          buildFeatureDocumentInput({ code: "GUESTBOOK", label: "방명록" }),
        );

        const result = await getAdminPremiumFeaturesPageService({
          q: "없는기능",
        });

        expect(result.items).toEqual([]);
      });

      // 검색과 커서가 각자 최상위 $or를 쓰면 뒤에 쓴 쪽이 앞을 덮어써 한쪽이
      // 조용히 무시된다 — 둘이 동시에 걸렸을 때 전부 적용되는지가 이 계약의 핵심이다.
      it("검색 결과를 offset 페이지로 나눠 반환한다", async () => {
        for (let i = 0; i < 3; i += 1) {
          const feature = await FeatureModel.create(
            buildFeatureDocumentInput({
              code: `GUESTBOOK_${i}`,
              label: "방명록",
            }),
          );
          await setCreatedAt(feature._id, new Date(2026, 0, i + 1));
        }
        const other = await FeatureModel.create(
          buildFeatureDocumentInput({ code: "MAP", label: "지도" }),
        );
        await setCreatedAt(other._id, new Date(2026, 1, 1));

        const first = await getAdminPremiumFeaturesPageService({
          q: "방명록",
          limit: 2,
          page: 1,
        });
        expect(first.items).toHaveLength(2);
        expect(first).toMatchObject({ total: 3, totalPages: 2 });

        const second = await getAdminPremiumFeaturesPageService({
          q: "방명록",
          limit: 2,
          page: 2,
        });

        expect(second.items).toHaveLength(1);
        expect(second).toMatchObject({ total: 3, page: 2, totalPages: 2 });
        expect(
          [...first.items, ...second.items].every((f) => f.label === "방명록"),
        ).toBe(true);
      });
    });
  });
  describe("deletePremiumFeatureService", () => {
    const createReferencingProduct = async (featureId: string, title: string) =>
      createProductService(
        buildProductInput({ title, isPremium: true, featureIds: [featureId] }),
      );

    it("참조하는 상품이 없으면 문서를 삭제한다", async () => {
      const created = await createPremiumFeatureService(buildFeatureInput());

      const result = await deletePremiumFeatureService(String(created._id));

      expect(result).toBe(true);
      expect(await FeatureModel.findById(created._id).lean()).toBeNull();
    });

    it("존재하지 않는 id면 false를 리턴한다", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      expect(await deletePremiumFeatureService(missingId)).toBe(false);
    });

    it("ObjectId 형식이 아니면 false를 리턴한다", async () => {
      expect(await deletePremiumFeatureService("not-an-object-id")).toBe(false);
    });

    it("참조 중인 상품이 있으면 VALIDATION을 던지고 기능을 남긴다", async () => {
      const created = await createPremiumFeatureService(buildFeatureInput());
      await createReferencingProduct(String(created._id), "봄맞이 청첩장");

      await expect(
        deletePremiumFeatureService(String(created._id)),
      ).rejects.toMatchObject({ category: "VALIDATION" });
      expect(await FeatureModel.findById(created._id).lean()).not.toBeNull();
    });

    it("차단 메시지에 막고 있는 상품명을 담는다", async () => {
      const created = await createPremiumFeatureService(buildFeatureInput());
      await createReferencingProduct(String(created._id), "봄맞이 청첩장");

      await expect(
        deletePremiumFeatureService(String(created._id)),
      ).rejects.toMatchObject({
        message: expect.stringContaining("봄맞이 청첩장"),
      });
    });

    it("참조 상품이 미리보기 개수를 넘으면 나머지를 건수로 요약한다", async () => {
      const created = await createPremiumFeatureService(buildFeatureInput());
      for (const title of ["청첩장1", "청첩장2", "청첩장3", "청첩장4"]) {
        await createReferencingProduct(String(created._id), title);
      }

      await expect(
        deletePremiumFeatureService(String(created._id)),
      ).rejects.toMatchObject({ message: expect.stringContaining("외 1건") });
    });

    it("휴지통에 있는 상품이 참조해도 삭제를 막는다", async () => {
      const created = await createPremiumFeatureService(buildFeatureInput());
      await createReferencingProduct(String(created._id), "휴지통 청첩장");
      const product = await ProductModel.findOne({
        title: "휴지통 청첩장",
      }).lean<{ _id: mongoose.Types.ObjectId }>();
      await deleteProductService(String(product!._id));

      await expect(
        deletePremiumFeatureService(String(created._id)),
      ).rejects.toMatchObject({ category: "VALIDATION" });
    });

    // 삭제 가드는 ProductModel만 센다 — OrderModel은 세지 않는다. 주문이
    // code/label/price를 스냅샷으로 복사해 두어 원본이 사라져도 과거 주문과
    // 발행된 청첩장이 그대로 동작하기 때문이다(order.model의 featureId는 살아
    // 있는 외래키가 아니라 그때의 식별자 기록이다).
    it("과거 주문만 참조하는 기능은 삭제되고 주문 스냅샷은 그대로 남는다", async () => {
      const feature = await createPremiumFeatureService(buildFeatureInput());
      await createProductService(buildProductInput({ title: "주문된 청첩장" }));
      const product = await ProductModel.findOne({
        title: "주문된 청첩장",
      }).lean<{ _id: mongoose.Types.ObjectId }>();
      const baseInput = buildOrderInput();
      const order = await createOrderService({
        ...baseInput,
        product: {
          ...baseInput.product,
          productId: String(product!._id),
          selectedFeatures: [
            {
              featureId: String(feature._id),
              code: feature.code,
              label: feature.label,
              price: feature.additionalPrice,
            },
          ],
        },
      });

      expect(await deletePremiumFeatureService(String(feature._id))).toBe(true);

      const saved = await OrderModel.findById(order._id).lean();
      expect(saved?.product.selectedFeatures[0]).toMatchObject({
        code: "GALLERY_LIGHTBOX",
        label: "갤러리 확대 보기",
        price: 3000,
      });
    });

    it("다른 기능을 참조하는 상품은 삭제를 막지 않는다", async () => {
      const referenced = await createPremiumFeatureService(buildFeatureInput());
      const orphan = await FeatureModel.create(
        buildFeatureDocumentInput({ code: "MAP", label: "지도" }),
      );
      await createReferencingProduct(String(referenced._id), "봄맞이 청첩장");

      expect(await deletePremiumFeatureService(String(orphan._id))).toBe(true);
    });
  });
  describe("getSelectablePremiumFeatureService", () => {
    it("등록 가능(isActive: true) 기능만 리턴한다", async () => {
      await FeatureModel.create(
        buildFeatureDocumentInput({ code: "ACTIVE_ONE", isActive: true }),
      );
      await FeatureModel.create(
        buildFeatureDocumentInput({ code: "STOPPED_ONE", isActive: false }),
      );

      const result = await getSelectablePremiumFeatureService();

      expect(result.map((feature) => feature.code)).toEqual(["ACTIVE_ONE"]);
    });

    it("전체 조회는 등록 중단 기능도 함께 리턴한다", async () => {
      await FeatureModel.create(
        buildFeatureDocumentInput({ code: "ACTIVE_ONE", isActive: true }),
      );
      await FeatureModel.create(
        buildFeatureDocumentInput({ code: "STOPPED_ONE", isActive: false }),
      );

      const all = await getAllPremiumFeatureService();

      expect(all.map((feature) => feature.code).sort()).toEqual([
        "ACTIVE_ONE",
        "STOPPED_ONE",
      ]);
    });

    it("등록 가능한 기능이 없으면 빈 배열을 리턴한다", async () => {
      await FeatureModel.create(
        buildFeatureDocumentInput({ code: "STOPPED_ONE", isActive: false }),
      );

      expect(await getSelectablePremiumFeatureService()).toEqual([]);
    });
  });
});
