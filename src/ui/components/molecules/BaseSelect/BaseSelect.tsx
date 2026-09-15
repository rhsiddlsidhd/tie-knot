"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/atoms/select";
import React from "react";
import { cn } from "@/core/utils/cn";

interface SelectOption {
  value: string;
  label: string;
}

interface BaseSelectProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-label"?: string;
  /** 트리거에 그대로 전달한다 — atoms/select가 aria-invalid로 테두리를 붉게 바꾼다. */
  "aria-invalid"?: boolean;
}

/**
 * Atoms를 조합하여 데이터만 넣으면 렌더링되는 순수 Select 박스 컴포넌트
 */
const BaseSelect = ({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  placeholder = "선택해주세요",
  options,
  className,
  contentClassName,
  disabled,
  required,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: BaseSelectProps) => {
  return (
    <Select
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        className={cn("w-full", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className={cn("max-h-60!", contentClassName)}
        position="popper"
        align="start"
      >
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export { BaseSelect, type SelectOption };
