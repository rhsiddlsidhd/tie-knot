import type { ProductCategory } from "./product-category";

/** 상품 등록 폼과 수정 폼이 함께 다루는 상품 속성 — 화면 전용 상태는 포함하지 않는다. */
interface ProductFormFields {
  category: ProductCategory;
  subCategory: string;
  theme: string;
  isPremium: boolean;
  isFeature: boolean;
  featureIds: string[];
  minQuantity: number;
  isUnlimitedMax: boolean;
}

type ProductFormFieldsAction =
  | { type: "CHANGE_CATEGORY"; payload: ProductCategory }
  | { type: "CHANGE_SUB_CATEGORY"; payload: string }
  | { type: "CHANGE_THEME"; payload: string }
  | { type: "TOGGLE_PREMIUM"; payload: boolean }
  | { type: "TOGGLE_FEATURED"; payload: boolean }
  | {
      type: "TOGGLE_PREMIUM_FEATURE";
      payload: { id: string; checked: boolean };
    }
  | { type: "CHANGE_MIN_QUANTITY"; payload: number }
  | { type: "TOGGLE_UNLIMITED_MAX"; payload: boolean };

export type { ProductFormFields, ProductFormFieldsAction };
