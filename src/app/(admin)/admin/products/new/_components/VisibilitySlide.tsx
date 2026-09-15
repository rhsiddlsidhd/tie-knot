"use client";

import type { Dispatch } from "react";
import type { ApiResponse } from "@/core/domain/error";
import { getFieldError } from "@/core/utils/error";
import { FieldDescription } from "@/ui/components/atoms/field";
import { InputField } from "@/ui/components/organisms/InputField";
import { SwitchField } from "@/ui/components/organisms/SwitchField";
import type { ProductFormAction } from "../_types/productForm";
import { ProductFormSlideCard } from "./ProductFormSlideCard";

interface VisibilitySlideProps {
  state: ApiResponse<{ message: string }> | null;
  isFeature: boolean;
  dispatch: Dispatch<ProductFormAction>;
  onPrevious: () => void;
  onNext: () => void;
}

const VisibilitySlide = ({
  state,
  isFeature,
  dispatch,
  onPrevious,
  onNext,
}: VisibilitySlideProps) => {
  return (
    <ProductFormSlideCard
      step="visibility"
      title="노출 설정"
      description="상품 노출 및 정렬 순서를 관리합니다."
      previousLabel="가격 정보"
      nextLabel="썸네일 이미지"
      onPrevious={onPrevious}
      onNext={onNext}
    >
      <SwitchField
        id="isFeatured"
        label="추천 상품"
        description="메인 페이지에 추천 상품으로 노출됩니다."
        checked={isFeature}
        onCheckedChange={(checked) =>
          dispatch({ type: "TOGGLE_FEATURED", payload: checked })
        }
      />
      <InputField
        id="priority"
        name="priority"
        label="추천 우선순위"
        type="number"
        placeholder="0"
        min={0}
        max={100}
        step={1}
        defaultValue={0}
        error={getFieldError(state, "priority")}
      />
      <FieldDescription>
        높은 숫자일수록 상단에 노출됩니다 (0-100)
      </FieldDescription>
    </ProductFormSlideCard>
  );
};

export { VisibilitySlide };
