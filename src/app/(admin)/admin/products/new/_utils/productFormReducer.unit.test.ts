import { describe, expect, it } from "vitest";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import type { ProductFormState } from "../_types/productForm";
import {
  initialProductFormState,
  productFormReducer,
} from "./productFormReducer";

const stateWith = (overrides: Partial<ProductFormState>): ProductFormState => ({
  ...initialProductFormState,
  ...overrides,
});

describe("productFormReducer", () => {
  it("초기 상태는 모바일 청첩장 카테고리의 첫 스텝에서 시작한다", () => {
    expect(initialProductFormState.category).toBe(MOBILE_INVITATION_CATEGORY);
    expect(initialProductFormState.activeStep).toBe("basic");
    expect(initialProductFormState.stepErrors).toEqual({});
    expect(initialProductFormState.minQuantity).toBe(1);
    expect(initialProductFormState.isUnlimitedMax).toBe(true);
  });

  it("카테고리를 바꾸면 서브 카테고리 선택과 기본 정보 오류를 비운다", () => {
    const state = stateWith({
      subCategory: "wedding",
      category: "favor",
      stepErrors: { basic: "서브 카테고리를 선택해주세요." },
    });

    const next = productFormReducer(state, {
      type: "CHANGE_CATEGORY",
      payload: MOBILE_INVITATION_CATEGORY,
    });

    expect(next.category).toBe(MOBILE_INVITATION_CATEGORY);
    expect(next.subCategory).toBe("");
    expect(next.stepErrors.basic).toBeUndefined();
  });

  it("서브 카테고리를 고르면 기본 정보 오류를 지운다", () => {
    const state = stateWith({
      stepErrors: { basic: "서브 카테고리를 선택해주세요." },
    });

    const next = productFormReducer(state, {
      type: "CHANGE_SUB_CATEGORY",
      payload: "wedding",
    });

    expect(next.subCategory).toBe("wedding");
    expect(next.stepErrors.basic).toBeUndefined();
  });

  it("프리미엄을 끄면 선택한 옵션과 가격 스텝 오류를 비운다", () => {
    const state = stateWith({
      isPremium: true,
      featureIds: ["feature-1"],
      stepErrors: { pricing: "옵션을 선택해주세요." },
    });

    const next = productFormReducer(state, {
      type: "TOGGLE_PREMIUM",
      payload: false,
    });

    expect(next.isPremium).toBe(false);
    expect(next.featureIds).toEqual([]);
    expect(next.stepErrors.pricing).toBeUndefined();
  });

  it("옵션을 바꾸면 가격 스텝 오류를 지운다", () => {
    const state = stateWith({
      isPremium: true,
      stepErrors: { pricing: "옵션을 선택해주세요." },
    });

    const next = productFormReducer(state, {
      type: "TOGGLE_PREMIUM_FEATURE",
      payload: { id: "feature-1", checked: true },
    });

    expect(next.stepErrors.pricing).toBeUndefined();
  });

  it("스텝을 열면 활성 스텝만 바꾼다", () => {
    const state = stateWith({ stepErrors: { basic: "메시지" } });

    const next = productFormReducer(state, {
      type: "OPEN_STEP",
      payload: "pricing",
    });

    expect(next.activeStep).toBe("pricing");
    expect(next.stepErrors).toEqual({ basic: "메시지" });
  });

  it("스텝 검증에 실패하면 그 스텝을 열고 오류 메시지를 남긴다", () => {
    const next = productFormReducer(initialProductFormState, {
      type: "FAIL_STEP",
      payload: { step: "thumbnail", message: "썸네일 이미지를 등록해주세요." },
    });

    expect(next.activeStep).toBe("thumbnail");
    expect(next.stepErrors.thumbnail).toBe("썸네일 이미지를 등록해주세요.");
  });

  it("스텝 오류를 지우면 해당 스텝의 메시지만 제거한다", () => {
    const state = stateWith({
      stepErrors: { basic: "기본 오류", pricing: "가격 오류" },
    });

    const next = productFormReducer(state, {
      type: "CLEAR_STEP_ERROR",
      payload: "basic",
    });

    expect(next.stepErrors).toEqual({ pricing: "가격 오류" });
  });

  it("지울 오류가 없으면 이전 상태를 그대로 반환한다", () => {
    const state = stateWith({ stepErrors: { pricing: "가격 오류" } });

    const next = productFormReducer(state, {
      type: "CLEAR_STEP_ERROR",
      payload: "basic",
    });

    expect(next).toBe(state);
  });

  it("연속 등록 초기화는 카테고리·서브 카테고리·테마만 유지한다", () => {
    const state = stateWith({
      category: "favor",
      subCategory: "gift",
      theme: "spring",
      isPremium: true,
      isFeature: true,
      featureIds: ["feature-1"],
      priceError: "할인가가 정가보다 큽니다.",
      minQuantity: 5,
      isUnlimitedMax: false,
      activeStep: "quantity",
      stepErrors: { quantity: "수량 오류" },
    });

    const next = productFormReducer(state, { type: "RESET_AFTER_CONTINUE" });

    expect(next).toEqual({
      category: "favor",
      subCategory: "gift",
      theme: "spring",
      isPremium: false,
      isFeature: false,
      featureIds: [],
      priceError: null,
      minQuantity: 1,
      isUnlimitedMax: true,
      activeStep: "basic",
      stepErrors: {},
    });
  });
});
