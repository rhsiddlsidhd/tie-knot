import { describe, expect, it } from "vitest";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import type { ProductFormFields } from "@/core/domain/product-form";
import { productFormFieldsReducer } from "./product-form";

const fieldsWith = (
  overrides?: Partial<ProductFormFields>,
): ProductFormFields => ({
  category: MOBILE_INVITATION_CATEGORY,
  subCategory: "",
  theme: "default",
  isPremium: false,
  isFeature: false,
  featureIds: [],
  minQuantity: 1,
  isUnlimitedMax: true,
  ...overrides,
});

describe("productFormFieldsReducer", () => {
  it("카테고리를 바꾸면 서브 카테고리 선택을 비운다", () => {
    const fields = fieldsWith({ category: "favor", subCategory: "candle" });

    const next = productFormFieldsReducer(fields, {
      type: "CHANGE_CATEGORY",
      payload: MOBILE_INVITATION_CATEGORY,
    });

    expect(next.category).toBe(MOBILE_INVITATION_CATEGORY);
    expect(next.subCategory).toBe("");
  });

  it("옵션을 체크하면 추가하고 해제하면 제거한다", () => {
    const added = productFormFieldsReducer(fieldsWith(), {
      type: "TOGGLE_PREMIUM_FEATURE",
      payload: { id: "feature-1", checked: true },
    });
    expect(added.featureIds).toEqual(["feature-1"]);

    const removed = productFormFieldsReducer(added, {
      type: "TOGGLE_PREMIUM_FEATURE",
      payload: { id: "feature-1", checked: false },
    });
    expect(removed.featureIds).toEqual([]);
  });

  it("같은 옵션을 다시 체크해도 중복으로 쌓지 않는다", () => {
    const added = productFormFieldsReducer(fieldsWith(), {
      type: "TOGGLE_PREMIUM_FEATURE",
      payload: { id: "feature-1", checked: true },
    });

    const again = productFormFieldsReducer(added, {
      type: "TOGGLE_PREMIUM_FEATURE",
      payload: { id: "feature-1", checked: true },
    });

    expect(again.featureIds).toEqual(["feature-1"]);
  });

  it("프리미엄을 끄면 선택한 옵션을 비운다", () => {
    const fields = fieldsWith({ isPremium: true, featureIds: ["feature-1"] });

    const next = productFormFieldsReducer(fields, {
      type: "TOGGLE_PREMIUM",
      payload: false,
    });

    expect(next.isPremium).toBe(false);
    expect(next.featureIds).toEqual([]);
  });

  it("프리미엄을 켜면 이미 고른 옵션은 유지한다", () => {
    const fields = fieldsWith({ featureIds: ["feature-1"] });

    const next = productFormFieldsReducer(fields, {
      type: "TOGGLE_PREMIUM",
      payload: true,
    });

    expect(next.featureIds).toEqual(["feature-1"]);
  });

  it("나머지 속성은 해당 필드만 바꾼다", () => {
    const fields = fieldsWith();

    expect(
      productFormFieldsReducer(fields, {
        type: "CHANGE_SUB_CATEGORY",
        payload: "wedding",
      }).subCategory,
    ).toBe("wedding");
    expect(
      productFormFieldsReducer(fields, {
        type: "CHANGE_THEME",
        payload: "blossom",
      }).theme,
    ).toBe("blossom");
    expect(
      productFormFieldsReducer(fields, {
        type: "TOGGLE_FEATURED",
        payload: true,
      }).isFeature,
    ).toBe(true);
    expect(
      productFormFieldsReducer(fields, {
        type: "CHANGE_MIN_QUANTITY",
        payload: 5,
      }).minQuantity,
    ).toBe(5);
    expect(
      productFormFieldsReducer(fields, {
        type: "TOGGLE_UNLIMITED_MAX",
        payload: false,
      }).isUnlimitedMax,
    ).toBe(false);
  });

  it("화면 전용 상태를 함께 담은 상태를 넘겨도 그 값은 유지한다", () => {
    const state = { ...fieldsWith(), activeStep: "pricing" as const };

    const next = productFormFieldsReducer(state, {
      type: "TOGGLE_PREMIUM",
      payload: true,
    });

    expect(next.activeStep).toBe("pricing");
  });

  it("상태를 직접 변경하지 않고 새 객체를 반환한다", () => {
    const fields = fieldsWith();

    const next = productFormFieldsReducer(fields, {
      type: "TOGGLE_PREMIUM",
      payload: true,
    });

    expect(next).not.toBe(fields);
    expect(fields.isPremium).toBe(false);
  });
});
