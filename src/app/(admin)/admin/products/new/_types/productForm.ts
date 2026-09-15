type ProductFormStep =
  | "basic"
  | "pricing"
  | "visibility"
  | "thumbnail"
  | "preview"
  | "images"
  | "quantity";

type StepErrors = Partial<Record<ProductFormStep, string>>;

export type { ProductFormStep, StepErrors };
