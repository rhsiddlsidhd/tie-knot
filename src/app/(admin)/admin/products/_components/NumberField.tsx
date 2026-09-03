"use client";

import { Input } from "@/ui/components/atoms/input";
import { FormField } from "@/ui/components/organisms/FormField";
import type { FieldBase } from "@/core/domain/field";
import type React from "react";
import { useState } from "react";

export interface NumberFieldProps extends Omit<FieldBase, "defaultValue"> {
  defaultValue?: string | number;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

/**
 * 숫자 입력 필드. 단위(unit)가 있으면 입력창 우측에 suffix로 렌더한다.
 * value가 주어지면 controlled(부모가 상태를 소유), 없으면 TextField와 동일하게
 * defaultValue 기반 내부 state로 관리한다.
 */
const NumberField = ({
  id,
  name,
  children,
  defaultValue = "",
  value,
  onChange,
  unit,
  min,
  max,
  step,
  placeholder,
  required = false,
  disabled,
  error,
}: NumberFieldProps) => {
  const isControlled = value !== undefined;
  const [info, setInfo] = useState(defaultValue);
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);

  if (!isControlled && defaultValue !== prevDefaultValue) {
    setPrevDefaultValue(defaultValue);
    setInfo(defaultValue);
  }

  const inputValue = isControlled ? value : info;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInfo(e.target.value);
    }
    onChange?.(e);
  };

  return (
    <FormField id={id} label={children} error={error} required={required}>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type="number"
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          value={inputValue}
          onChange={handleChange}
          aria-invalid={!!error}
          className={unit ? "min-w-24 pr-12" : "min-w-24"}
        />
        {unit && (
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
            {unit}
          </span>
        )}
      </div>
    </FormField>
  );
};

export { NumberField };
