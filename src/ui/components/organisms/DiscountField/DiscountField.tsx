"use client";

import { useEffect, useRef, useState } from "react";
import { FieldDescription } from "@/ui/components/atoms/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/ui/components/atoms/input-group";
import { BaseSelect } from "@/ui/components/molecules/BaseSelect";
import { FieldFrame } from "@/ui/components/organisms/FieldFrame";

type DiscountType = "rate" | "amount";

interface DiscountFieldProps {
  idPrefix: string;
  defaultType: DiscountType;
  defaultValue: number;
  error?: string;
}

const DISCOUNT_TYPE_OPTIONS = [
  { value: "rate", label: "비율 (%)" },
  { value: "amount", label: "금액 (원)" },
] satisfies { value: DiscountType; label: string }[];

/** 할인 방식 선택과 할인값 입력, 클라이언트 검증을 하나의 필드로 제공한다. */
const DiscountField = ({
  idPrefix,
  defaultType,
  defaultValue,
  error,
}: DiscountFieldProps) => {
  const [discountType, setDiscountType] = useState(defaultType);
  const [inputError, setInputError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typeId = `${idPrefix}-type`;
  const valueId = `${idPrefix}-value`;
  const displayedError = inputError ?? error;

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;

    const handleReset = () => {
      setDiscountType(defaultType);
      setInputError(null);
    };

    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [defaultType]);

  return (
    <FieldFrame id={valueId} label="할인" error={displayedError}>
      <div className="flex gap-2">
        <div className="w-32 shrink-0">
          <BaseSelect
            id={typeId}
            name="discount.discountType"
            value={discountType}
            onValueChange={(value) => {
              setDiscountType(value as DiscountType);
              setInputError(null);
            }}
            options={DISCOUNT_TYPE_OPTIONS}
            aria-label="할인 방식"
            aria-invalid={!!displayedError}
          />
        </div>
        <InputGroup className="flex-1">
          <InputGroupInput
            ref={inputRef}
            id={valueId}
            name="discount.value"
            type="number"
            placeholder="0"
            min={0}
            step={discountType === "rate" ? "0.01" : "1"}
            max={discountType === "rate" ? 1 : undefined}
            defaultValue={defaultValue}
            aria-invalid={!!displayedError}
            onChange={(event) => {
              const value = event.target.value;
              setInputError(
                discountType === "amount" &&
                  value !== "" &&
                  !Number.isInteger(Number(value))
                  ? "할인액은 원 단위 정수로 입력해주세요."
                  : null,
              );
            }}
          />
          <InputGroupAddon align="inline-end">
            {discountType === "rate" ? "율" : "원"}
          </InputGroupAddon>
        </InputGroup>
      </div>
      <FieldDescription>
        {discountType === "rate"
          ? "0~1 사이 소수 입력 (예: 0.1 = 10% 할인)"
          : "차감 금액 입력"}
      </FieldDescription>
    </FieldFrame>
  );
};

export { DiscountField };
export type { DiscountFieldProps, DiscountType };
