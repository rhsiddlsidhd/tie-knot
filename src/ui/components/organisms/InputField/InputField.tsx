import type React from "react";
import { Input } from "@/ui/components/atoms/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/ui/components/atoms/input-group";
import { FieldFrame } from "@/ui/components/organisms/FieldFrame";

interface InputFieldProps extends React.ComponentProps<typeof Input> {
  id: string;
  name: string;
  label: React.ReactNode;
  error?: string;
  suffix?: React.ReactNode;
}

/** 라벨과 오류 UI를 포함한 범용 HTML input 필드다. */
const InputField = ({
  id,
  name,
  label,
  error,
  suffix,
  type = "text",
  ...inputProps
}: InputFieldProps) => {
  const sharedProps = {
    ...inputProps,
    id,
    name,
    type,
    "aria-invalid": !!error,
  };

  return (
    <FieldFrame id={id} label={label} error={error}>
      {suffix === undefined ? (
        <Input {...sharedProps} />
      ) : (
        <InputGroup>
          <InputGroupInput {...sharedProps} />
          <InputGroupAddon align="inline-end">{suffix}</InputGroupAddon>
        </InputGroup>
      )}
    </FieldFrame>
  );
};

export { InputField };
export type { InputFieldProps };
