import type { ProductCategory } from "@/core/domain/product-category";
import type {
  ProductFormFields,
  ProductFormFieldsAction,
} from "@/core/domain/product-form";

type ProductFormStep =
  | "basic"
  | "pricing"
  | "visibility"
  | "thumbnail"
  | "preview"
  | "images"
  | "quantity";

type StepErrors = Partial<Record<ProductFormStep, string>>;

/** 공용 상품 속성에 등록 폼 전용 단계 상태를 더한 것이 등록 폼의 상태다. */
interface ProductFormState extends ProductFormFields {
  priceError: string | null;
  activeStep: ProductFormStep;
  stepErrors: StepErrors;
}

type ProductFormAction =
  | ProductFormFieldsAction
  | { type: "SET_PRICE_ERROR"; payload: string | null }
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
