import { describe, expect, it } from "vitest";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import type { StepValidationInput } from "../_types/productForm";
import { getStepErrorMessage } from "./productFormValidation";

const validInput: StepValidationInput = {
  category: MOBILE_INVITATION_CATEGORY,
  subCategory: "wedding",
  isPremium: false,
  featureIds: [],
  priceError: null,
  thumbnailCount: 1,
  imageCount: 1,
};

const inputWith = (
  overrides: Partial<StepValidationInput>,
): StepValidationInput => ({ ...validInput, ...overrides });

describe("getStepErrorMessage", () => {
  it("모든 값이 유효하면 어떤 스텝에서도 메시지를 만들지 않는다", () => {
    const steps = [
      "basic",
      "pricing",
      "visibility",
      "thumbnail",
      "preview",
      "images",
      "quantity",
    ] as const;

    steps.forEach((step) => {
      expect(getStepErrorMessage(step, validInput)).toBeUndefined();
    });
  });

  it("서브 카테고리를 고르지 않으면 기본 정보 스텝을 막는다", () => {
    expect(
      getStepErrorMessage("basic", inputWith({ subCategory: "" })),
    ).toBe("서브 카테고리를 선택해주세요.");
  });

  it("가격 입력 오류가 있으면 그 메시지를 가격 스텝에 그대로 전달한다", () => {
    expect(
      getStepErrorMessage(
        "pricing",
        inputWith({ priceError: "할인가가 정가보다 클 수 없습니다." }),
      ),
    ).toBe("할인가가 정가보다 클 수 없습니다.");
  });

  it("프리미엄 상품인데 옵션을 고르지 않으면 가격 스텝을 막는다", () => {
    expect(
      getStepErrorMessage(
        "pricing",
        inputWith({ isPremium: true, featureIds: [] }),
      ),
    ).toBe("옵션을 선택해주세요.");
  });

  it("프리미엄 상품이라도 옵션을 골랐으면 통과시킨다", () => {
    expect(
      getStepErrorMessage(
        "pricing",
        inputWith({ isPremium: true, featureIds: ["feature-1"] }),
      ),
    ).toBeUndefined();
  });

  it("썸네일이 없으면 썸네일 스텝을 막는다", () => {
    expect(
      getStepErrorMessage("thumbnail", inputWith({ thumbnailCount: 0 })),
    ).toBe("썸네일 이미지를 등록해주세요.");
  });

  it("실물 상품은 상세 이미지가 없으면 이미지 스텝을 막는다", () => {
    expect(
      getStepErrorMessage(
        "images",
        inputWith({ category: "favor", imageCount: 0 }),
      ),
    ).toBe("상세 이미지를 1장 이상 등록해주세요.");
  });

  it("모바일 청첩장은 상세 이미지가 없어도 통과시킨다", () => {
    expect(
      getStepErrorMessage(
        "images",
        inputWith({ category: MOBILE_INVITATION_CATEGORY, imageCount: 0 }),
      ),
    ).toBeUndefined();
  });
});
