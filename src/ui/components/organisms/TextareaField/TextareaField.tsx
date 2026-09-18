import type React from "react";
import { Textarea } from "@/ui/components/atoms/textarea";
import { FieldFrame } from "@/ui/components/organisms/FieldFrame";

interface TextareaFieldProps extends React.ComponentProps<typeof Textarea> {
  id: string;
  name: string;
  label: React.ReactNode;
  error?: string;
}

/** 라벨과 오류 UI를 포함한 범용 textarea 필드다. */
const TextareaField = ({
  id,
  name,
  label,
  error,
  ...textareaProps
}: TextareaFieldProps) => {
  return (
    <FieldFrame id={id} label={label} error={error}>
      <Textarea {...textareaProps} id={id} name={name} aria-invalid={!!error} />
    </FieldFrame>
  );
};

export { TextareaField };
export type { TextareaFieldProps };
