import type { ProductCategory } from "@/core/domain/product-category";

type ProductFormStep =
  | "basic"
  | "pricing"
  | "visibility"
  | "thumbnail"
  | "preview"
  | "images"
  | "quantity";

type StepErrors = Partial<Record<ProductFormStep, string>>;

interface ProductFormState {
  category: ProductCategory;
  subCategory: string;
  theme: string;
  isPremium: boolean;
  isFeature: boolean;
  featureIds: string[];
  priceError: string | null;
  minQuantity: number;
  isUnlimitedMax: boolean;
  activeStep: ProductFormStep;
  stepErrors: StepErrors;
}

type ProductFormAction =
  | { type: "CHANGE_CATEGORY"; payload: ProductCategory }
  | { type: "CHANGE_SUB_CATEGORY"; payload: string }
  | { type: "CHANGE_THEME"; payload: string }
  | { type: "TOGGLE_PREMIUM"; payload: boolean }
  | { type: "TOGGLE_FEATURE"; payload: { id: string; checked: boolean } }
  | { type: "SET_PRICE_ERROR"; payload: string | null }
  | { type: "CHANGE_MIN_QUANTITY"; payload: number }
  | { type: "TOGGLE_UNLIMITED_MAX"; payload: boolean }
  | { type: "OPEN_STEP"; payload: ProductFormStep }
  | { type: "FAIL_STEP"; payload: { step: ProductFormStep; message: string } }
  | { type: "CLEAR_STEP_ERROR"; payload: ProductFormStep }
  | { type: "RESET_AFTER_CONTINUE" };

/** 스텝별 비즈니스 규칙 판정에 필요한 값 — DOM 제약 검사는 포함하지 않는다. */
interface StepValidationInput {
  category: ProductCategory;
  subCategory: string;
  isPremium: boolean;
  featureIds: string[];
  priceError: string | null;
  thumbnailCount: number;
  imageCount: number;
}

export type {
  ProductFormAction,
  ProductFormState,
  ProductFormStep,
  StepErrors,
  StepValidationInput,
};
