"use client";

import { memo, type Dispatch } from "react";
import {
  getCategoryOptions,
  getSubCategoryOptions,
} from "@/core/utils/category";
import { getFieldError } from "@/core/utils/error";
import type { ApiResponse } from "@/core/domain/error";
import type { ProductCategory } from "@/core/domain/product-category";
import { getMobileInvitationThemeOptions } from "@/core/utils/theme";
import { InputField } from "@/ui/components/organisms/InputField";
import { SelectField } from "@/ui/components/organisms/SelectField";
import { TextareaField } from "@/ui/components/organisms/TextareaField";
import type { ProductFormAction } from "../_types/productForm";
import { ProductFormSlideCard } from "./ProductFormSlideCard";

interface BasicInfoSlideProps {
  state: ApiResponse<{ message: string }> | null;
  category: ProductCategory;
  subCategory: string;
  theme: string;
  isMobileInvitation: boolean;
  stepError?: string;
  dispatch: Dispatch<ProductFormAction>;
  onNext: () => void;
}

const BasicInfoSlide = memo(
  ({
    state,
    category,
    subCategory,
    theme,
    isMobileInvitation,
    stepError,
    dispatch,
    onNext,
  }: BasicInfoSlideProps) => {
    return (
      <ProductFormSlideCard
        step="basic"
        title="기본 정보"
        description="상품의 이름, 설명, 분류 정보를 입력합니다."
        required
        nextLabel="가격 정보"
        onNext={onNext}
      >
        <InputField
          id="title"
          name="title"
          label="상품명"
          placeholder="예: 엘레강트 로즈 청첩장"
          required
          error={getFieldError(state, "title")}
        />

        <TextareaField
          id="description"
          name="description"
          label="상품 설명"
          placeholder="상품에 대한 자세한 설명을 입력하세요."
          rows={4}
          required
          error={getFieldError(state, "description")}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <SelectField
            id="category"
            name="category"
            defaultValue={category}
            onValueChange={(value) => {
              dispatch({
                type: "CHANGE_CATEGORY",
                payload: value as ProductCategory,
              });
            }}
            placeholder="카테고리를 선택하세요"
            data={getCategoryOptions()}
            error={getFieldError(state, "category")}
            required
          >
            카테고리(대분류)
          </SelectField>

          <SelectField
            id="subCategory"
            name="subCategory"
            defaultValue={subCategory}
            onValueChange={(value) => {
              dispatch({ type: "CHANGE_SUB_CATEGORY", payload: value });
            }}
            placeholder="서브 카테고리를 선택하세요"
            data={getSubCategoryOptions(category)}
            error={getFieldError(state, "subCategory") || stepError}
            required
          >
            서브 카테고리
          </SelectField>

          {isMobileInvitation && (
            <SelectField
              id="theme"
              name="theme"
              defaultValue={theme}
              onValueChange={(value) =>
                dispatch({ type: "CHANGE_THEME", payload: value })
              }
              placeholder="테마를 선택하세요"
              data={getMobileInvitationThemeOptions()}
              error={getFieldError(state, "theme")}
            >
              테마
            </SelectField>
          )}
        </div>
      </ProductFormSlideCard>
    );
  },
);

BasicInfoSlide.displayName = "BasicInfoSlide";

export { BasicInfoSlide };
