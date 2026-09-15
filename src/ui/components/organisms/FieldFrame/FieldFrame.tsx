import type React from "react";
import { Field, FieldError, FieldLabel } from "@/ui/components/atoms/field";

interface FieldFrameProps {
  id?: string;
  label: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}

/** 입력 UI에 공통 라벨과 오류 상태를 제공한다. */
const FieldFrame = ({ id, label, error, children }: FieldFrameProps) => {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id} className="cursor-pointer">
        {label}
      </FieldLabel>
      {children}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
};

export { FieldFrame };
export type { FieldFrameProps };
