"use client";

import { memo, type Dispatch } from "react";
import type { ApiResponse } from "@/core/domain/error";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import { getFieldError } from "@/core/utils/error";
import { Checkbox } from "@/ui/components/atoms/checkbox";
import { Field, FieldError, FieldLabel } from "@/ui/components/atoms/field";
import { TypographyH4 } from "@/ui/components/atoms/typography";
import { DiscountField } from "@/ui/components/organisms/DiscountField";
import { InputField } from "@/ui/components/organisms/InputField";
import { SwitchField } from "@/ui/components/organisms/SwitchField";
import type { ProductFormAction } from "../_types/productForm";
import { ProductFormSlideCard } from "./ProductFormSlideCard";

interface PricingSlideProps {
  state: ApiResponse<{ message: string }> | null;
  premiumFeatures: PremiumFeature[];
  isPremium: boolean;
  featureIds: string[];
  priceInputError: string | null;
  stepError?: string;
  dispatch: Dispatch<ProductFormAction>;
  onPrevious: () => void;
  onNext: () => void;
}

const PricingSlide = memo(
  ({
    state,
    premiumFeatures,
    isPremium,
    featureIds,
    priceInputError,
    stepError,
    dispatch,
    onPrevious,
    onNext,
  }: PricingSlideProps) => {
    return (
      <ProductFormSlideCard
        step="pricing"
        title="가격 정보"
        description="상품의 가격 및 할인, 프리미엄 옵션을 설정합니다."
        required
        previousLabel="기본 정보"
        nextLabel="노출 설정"
        onPrevious={onPrevious}
        onNext={onNext}
      >
        <InputField
          id="price"
          name="price"
          label="기본 가격"
          type="number"
          placeholder="0"
          min={0}
          step={1}
          suffix="원"
          required
          error={priceInputError || getFieldError(state, "price")}
          onChange={(event) => {
            const value = event.target.value;
            dispatch({ type: "CLEAR_STEP_ERROR", payload: "pricing" });
            dispatch({
              type: "SET_PRICE_ERROR",
              payload:
                value !== "" && !Number.isInteger(Number(value))
                  ? "가격은 원 단위 정수로 입력해주세요."
                  : null,
            });
          }}
        />

        <DiscountField
          idPrefix="product-discount"
          defaultType="rate"
          defaultValue={0}
          error={getFieldError(state, "discount")}
        />

        <SwitchField
          id="isPremium"
          label="프리미엄 상품"
          description="추가 유료 옵션을 제공하는 상품입니다."
          checked={isPremium}
          onCheckedChange={(checked) =>
            dispatch({ type: "TOGGLE_PREMIUM", payload: checked })
          }
        />

        {isPremium && (
          <div className="space-y-4 rounded-lg border border-dashed p-4">
            <TypographyH4 className="text-foreground font-medium">
              프리미엄 기능 선택
            </TypographyH4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {premiumFeatures.map((feature) => (
                <Field
                  key={feature.code}
                  orientation="horizontal"
                  className="gap-2"
                >
                  <Checkbox
                    id={`feature-${feature.code}`}
                    checked={featureIds.includes(feature._id)}
                    onCheckedChange={(checked) =>
                      dispatch({
                        type: "TOGGLE_PREMIUM_FEATURE",
                        payload: { id: feature._id, checked: !!checked },
                      })
                    }
                  />
                  <FieldLabel
                    htmlFor={`feature-${feature.code}`}
                    className="cursor-pointer text-sm leading-none font-medium"
                  >
                    {feature.label}
                  </FieldLabel>
                </Field>
              ))}
            </div>
            <FieldError>
              {getFieldError(state, "featureIds") || stepError}
            </FieldError>
          </div>
        )}
      </ProductFormSlideCard>
    );
  },
);

PricingSlide.displayName = "PricingSlide";

export { PricingSlide };
