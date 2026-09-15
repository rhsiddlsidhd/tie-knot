"use client";

import React, { useState } from "react";
import { Switch } from "@/ui/components/atoms/switch";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldDescription,
} from "@/ui/components/atoms/field";

import type { FieldBase } from "@/core/domain/field";

type SwitchFieldProps = Omit<FieldBase, "defaultValue"> & {
  message?: string;
  defaultValue?: boolean;
};

const SwitchField = ({
  id,
  name,
  children,
  message,
  defaultValue,
}: SwitchFieldProps) => {
  const [info, setInfo] = useState<boolean>(defaultValue ?? false);

  return (
    <Field
      orientation="horizontal"
      className="border-border rounded-lg border p-4"
    >
      <FieldContent>
        <FieldLabel htmlFor={id} className="cursor-pointer text-base">
          {children}
        </FieldLabel>
        <FieldDescription>{message}</FieldDescription>
      </FieldContent>
      <Switch
        id={id}
        name={name}
        checked={info}
        onCheckedChange={(checked) => setInfo(checked)}
      />
    </Field>
  );
};

export { SwitchField };
