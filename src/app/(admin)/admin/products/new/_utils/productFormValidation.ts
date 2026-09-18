import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import type {
  ProductFormStep,
  StepValidationInput,
} from "../_types/productForm";

/**
 * 스텝별 비즈니스 규칙만 판정한다 — required·type 같은 브라우저 제약은
 * checkValidity()가 담당하므로 여기서 다시 검사하지 않는다.
 */
const getStepErrorMessage = (
  step: ProductFormStep,
  input: StepValidationInput,
): string | undefined => {
  if (step === "basic" && !input.subCategory) {
    return "서브 카테고리를 선택해주세요.";
  }

  if (step === "pricing") {
    if (input.priceError) return input.priceError;
    if (input.isPremium && input.featureIds.length === 0) {
      return "옵션을 선택해주세요.";
    }
  }

  if (step === "thumbnail" && input.thumbnailCount === 0) {
    return "썸네일 이미지를 등록해주세요.";
  }

  if (
    step === "images" &&
    input.category !== MOBILE_INVITATION_CATEGORY &&
    input.imageCount === 0
  ) {
    return "상세 이미지를 1장 이상 등록해주세요.";
  }

  return undefined;
};

export { getStepErrorMessage };
