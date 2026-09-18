"use client";

import type React from "react";
import { Switch } from "@/ui/components/atoms/switch";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
} from "@/ui/components/atoms/field";

interface SwitchFieldProps extends Omit<
  React.ComponentProps<typeof Switch>,
  "id" | "children"
> {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
}

const SwitchField = ({
  id,
  label,
  description,
  ...switchProps
}: SwitchFieldProps) => {
  return (
    <Field
      orientation="horizontal"
      className="border-border rounded-lg border p-4"
    >
      <FieldContent>
        <FieldLabel htmlFor={id} className="cursor-pointer text-base">
          {label}
        </FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <Switch id={id} {...switchProps} />
    </Field>
  );
};

export { SwitchField };
export type { SwitchFieldProps };
