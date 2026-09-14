import type React from "react";

interface FieldBase {
  id: string;
  name: string;
  children: React.ReactNode;
  defaultValue?: string;
}

export { type FieldBase };
