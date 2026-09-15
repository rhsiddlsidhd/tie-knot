import { describe, it, expect } from "vitest";
import { PremiumFeatureSchema } from "./premiumFeature.schema";

const validInput = {
  code: "GALLERY_LIGHTBOX",
  label: "갤러리 확대 보기",
  description: "사진을 눌러 전체화면으로 크게 볼 수 있습니다.",
  additionalPrice: 3000,
};

describe("PremiumFeatureSchema", () => {
  it("청첩장이 구현한 기능 code면 통과한다", () => {
    const result = PremiumFeatureSchema.safeParse(validInput);

    expect(result.success).toBe(true);
  });

  it("구현되지 않은 code는 거부한다", () => {
    const result = PremiumFeatureSchema.safeParse({
      ...validInput,
      code: "MAP",
    });

    expect(result.success).toBe(false);
  });

  it("대소문자가 다른 code는 거부한다", () => {
    const result = PremiumFeatureSchema.safeParse({
      ...validInput,
      code: "gallery_lightbox",
    });

    expect(result.success).toBe(false);
  });

  it("code가 비어 있으면 거부한다", () => {
    const result = PremiumFeatureSchema.safeParse({ ...validInput, code: "" });

    expect(result.success).toBe(false);
  });

  it("code 거부 사유를 code 필드 오류로 알린다", () => {
    const result = PremiumFeatureSchema.safeParse({
      ...validInput,
      code: "MAP",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0].path).toEqual(["code"]);
  });

  it("설명이 20자 미만이면 거부한다", () => {
    const result = PremiumFeatureSchema.safeParse({
      ...validInput,
      description: "짧은 설명",
    });

    expect(result.success).toBe(false);
  });
});
