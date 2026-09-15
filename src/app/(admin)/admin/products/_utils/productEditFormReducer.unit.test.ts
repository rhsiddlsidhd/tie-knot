import { describe, expect, it } from "vitest";
import type { Product } from "@/core/domain/product";
import {
  createProductEditFormState,
  productEditFormReducer,
} from "./productEditFormReducer";

const buildProduct = (overrides?: Partial<Product>): Product =>
  ({
    category: "mobile-invitation",
    subCategory: "wedding",
    theme: "default",
    isPremium: false,
    featureIds: [],
    isFeatured: false,
    minQuantity: 1,
    maxQuantity: 100,
    status: "active",
    ...overrides,
  }) as Product;

describe("createProductEditFormState", () => {
  it("기존 상품 값을 초기 상태로 옮긴다", () => {
    const state = createProductEditFormState(
      buildProduct({
        subCategory: "first-birthday",
        isPremium: true,
        featureIds: ["feature-1"],
        isFeatured: true,
        minQuantity: 2,
        maxQuantity: 50,
        status: "soldOut",
      }),
    );

    expect(state).toEqual({
      category: "mobile-invitation",
      subCategory: "first-birthday",
      theme: "default",
      isPremium: true,
      isFeature: true,
      featureIds: ["feature-1"],
      minQuantity: 2,
      isUnlimitedMax: false,
      status: "soldOut",
      maxQuantityDefault: 50,
    });
  });

  it("최대 수량이 0이면 무제한으로 시작하고 제안값은 1로 둔다", () => {
    const state = createProductEditFormState(buildProduct({ maxQuantity: 0 }));

    expect(state.isUnlimitedMax).toBe(true);
    expect(state.maxQuantityDefault).toBe(1);
  });
});

describe("productEditFormReducer", () => {
  it("판매 상태를 바꾼다", () => {
    const state = createProductEditFormState(buildProduct());

    const next = productEditFormReducer(state, {
      type: "CHANGE_STATUS",
      payload: "inactive",
    });

    expect(next.status).toBe("inactive");
  });

  it("무제한을 켜면 최대 수량 제안값은 그대로 둔다", () => {
    const state = createProductEditFormState(buildProduct({ maxQuantity: 50 }));

    const next = productEditFormReducer(state, {
      type: "TOGGLE_UNLIMITED_MAX",
      payload: true,
    });

    expect(next.isUnlimitedMax).toBe(true);
    expect(next.maxQuantityDefault).toBe(50);
  });

  it("무제한을 해제하면 최대 수량 제안값을 최소 수량 기준으로 갱신한다", () => {
    const state = createProductEditFormState(
      buildProduct({ minQuantity: 3, maxQuantity: 50 }),
    );

    const next = productEditFormReducer(state, {
      type: "TOGGLE_UNLIMITED_MAX",
      payload: false,
    });

    expect(next.isUnlimitedMax).toBe(false);
    expect(next.maxQuantityDefault).toBe(3);
  });

  it("최소 수량이 비어 있으면 최대 수량 제안값은 1이다", () => {
    const state = productEditFormReducer(
      createProductEditFormState(buildProduct({ maxQuantity: 0 })),
      { type: "CHANGE_MIN_QUANTITY", payload: NaN },
    );

    const next = productEditFormReducer(state, {
      type: "TOGGLE_UNLIMITED_MAX",
      payload: false,
    });

    expect(next.maxQuantityDefault).toBe(1);
  });

  it("공용 속성 전이는 공유 reducer에 위임한다", () => {
    const state = createProductEditFormState(
      buildProduct({ isPremium: true, featureIds: ["feature-1"] }),
    );

    const next = productEditFormReducer(state, {
      type: "TOGGLE_PREMIUM",
      payload: false,
    });

    expect(next.featureIds).toEqual([]);
    expect(next.status).toBe("active");
  });
});
