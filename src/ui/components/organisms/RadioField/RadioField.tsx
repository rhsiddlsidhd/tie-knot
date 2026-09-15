"use client";

import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/ui/components/atoms/radio-group";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
  FieldDescription,
} from "@/ui/components/atoms/field";
import type { FieldBase } from "@/core/domain/field";

type RadioFieldOption<T = string> = {
  id: string;
  value: T;
  title: string;
  description?: string;
  icon?: LucideIcon;
};

type RadioFieldProps<T = string> = Omit<FieldBase, "children"> & {
  options: RadioFieldOption<T>[];
  defaultValue?: T;
};

const RadioField = <T extends string = string>({
  name,
  options,
  defaultValue = "" as T,
}: RadioFieldProps<T>) => {
  const [info, setInfo] = useState<T>(defaultValue);

  return (
    <RadioGroup
      value={info}
      onValueChange={(val) => setInfo(val as T)}
      className="space-y-2"
      name={name}
    >
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <FieldLabel key={option.id} htmlFor={option.id}>
            <Field orientation="horizontal">
              <RadioGroupItem value={option.value} id={option.id} />
              {Icon && <Icon className="text-muted-foreground h-5 w-5" />}
              <FieldContent>
                <FieldTitle>{option.title}</FieldTitle>
                {option.description && (
                  <FieldDescription>{option.description}</FieldDescription>
                )}
              </FieldContent>
            </Field>
          </FieldLabel>
        );
      })}
    </RadioGroup>
  );
};

export { RadioField, type RadioFieldOption };
