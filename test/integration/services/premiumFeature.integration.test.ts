import { describe, it, expect, beforeEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { dbConnect } from "@/db/connect";
import { buildFeatureInput, clearCollections } from "@test/support";
import { FeatureModel } from "@/models/feature.model";
import {
  createPremiumFeatureService,
  getAdminPremiumFeaturesPageService,
  getAllPremiumFeatureService,
  getPremiumFeatureService,
  updatePremiumFeatureService,
} from "@/services/premiumFeature";

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
      await createPremiumFeatureService(
        buildFeatureInput({ code: "GUESTBOOK" }),
      );
      await createPremiumFeatureService(
        buildFeatureInput({
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
      await createPremiumFeatureService(
        buildFeatureInput({
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
          buildFeatureInput({ code: `FEATURE_${i}` }),
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

    it("limit을 넘으면 nextCursor로 다음 페이지가 이어지고 행이 중복/누락되지 않는다", async () => {
      const created = await createFeatures(3);

      const firstPage = await getAdminPremiumFeaturesPageService({ limit: 2 });
      expect(firstPage.items).toHaveLength(2);
      expect(firstPage.nextCursor).not.toBe(null);

      const secondPage = await getAdminPremiumFeaturesPageService({
        limit: 2,
        cursor: firstPage.nextCursor!,
      });
      expect(secondPage.items).toHaveLength(1);
      expect(secondPage.nextCursor).toBe(null);

      const paged = [...firstPage.items, ...secondPage.items].map(
        (feature) => feature._id,
      );
      expect(new Set(paged).size).toBe(3);
      expect(paged.sort()).toEqual([...created].sort());
    });

    it("마지막 페이지는 nextCursor가 null이다", async () => {
      await createFeatures(1);

      const result = await getAdminPremiumFeaturesPageService({});

      expect(result.nextCursor).toBe(null);
    });

    it("형식이 깨진 커서면 VALIDATION을 던진다", async () => {
      await expect(
        getAdminPremiumFeaturesPageService({ cursor: "!!!broken!!!" }),
      ).rejects.toMatchObject({ category: "VALIDATION" });
    });

    it("limit이 허용 범위를 벗어나면 VALIDATION을 던진다", async () => {
      await expect(
        getAdminPremiumFeaturesPageService({ limit: 0 }),
      ).rejects.toMatchObject({ category: "VALIDATION" });
    });
  });
});
