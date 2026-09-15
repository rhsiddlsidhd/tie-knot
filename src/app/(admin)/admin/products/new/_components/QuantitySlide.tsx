"use client";

import type { Dispatch } from "react";
import type { ApiResponse } from "@/core/domain/error";
import { getFieldError } from "@/core/utils/error";
import { Checkbox } from "@/ui/components/atoms/checkbox";
import { Field, FieldLabel } from "@/ui/components/atoms/field";
import { Input } from "@/ui/components/atoms/input";
import { FieldFrame } from "@/ui/components/organisms/FieldFrame";
import { InputField } from "@/ui/components/organisms/InputField";
import type { ProductFormAction } from "../_types/productForm";
import { ProductFormSlideCard } from "./ProductFormSlideCard";

interface QuantitySlideProps {
  state: ApiResponse<{ message: string }> | null;
  minQuantity: number;
  isUnlimitedMax: boolean;
  dispatch: Dispatch<ProductFormAction>;
  onPrevious: () => void;
}

const QuantitySlide = ({
  state,
  minQuantity,
  isUnlimitedMax,
  dispatch,
  onPrevious,
}: QuantitySlideProps) => {
  return (
    <ProductFormSlideCard
      step="quantity"
      title="구매 수량"
      description="고객이 한 번에 구매할 수 있는 수량 범위를 설정합니다."
      required
      previousLabel="상세 이미지"
      onPrevious={onPrevious}
    >
      <InputField
        id="minQuantity"
        name="minQuantity"
        label="최소 구매 수량"
        type="number"
        min={1}
        step={1}
        required
        value={Number.isNaN(minQuantity) ? "" : minQuantity}
        onChange={(event) => {
          const raw = event.target.value;
          dispatch({
            type: "CHANGE_MIN_QUANTITY",
            payload: raw === "" ? NaN : Number(raw),
          });
        }}
        error={getFieldError(state, "minQuantity")}
      />

      <FieldFrame
        id={isUnlimitedMax ? "maxQuantity-display" : "maxQuantity"}
        label="최대 구매 수량"
        error={getFieldError(state, "maxQuantity")}
      >
        {isUnlimitedMax ? (
          <>
            <Input
              id="maxQuantity-display"
              type="number"
              disabled
              placeholder="무제한"
            />
            <input type="hidden" name="maxQuantity" value="0" />
          </>
        ) : (
          <Input
            id="maxQuantity"
            name="maxQuantity"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={
              Number.isNaN(minQuantity) ? 1 : Math.max(1, minQuantity)
            }
          />
        )}
        <Field orientation="horizontal" className="gap-2 pt-1">
          <Checkbox
            id="isUnlimitedMax"
            checked={isUnlimitedMax}
            onCheckedChange={(checked) =>
              dispatch({ type: "TOGGLE_UNLIMITED_MAX", payload: !!checked })
            }
          />
          <FieldLabel
            htmlFor="isUnlimitedMax"
            className="cursor-pointer text-sm font-normal"
          >
            무제한
          </FieldLabel>
        </Field>
      </FieldFrame>
    </ProductFormSlideCard>
  );
};

export { QuantitySlide };
