import type { ProductFormStep } from "../_types/productForm";

const MOBILE_PRODUCT_FORM_STEPS: readonly ProductFormStep[] = [
  "basic",
  "pricing",
  "visibility",
  "thumbnail",
  "preview",
  "images",
  "quantity",
];

const PHYSICAL_PRODUCT_FORM_STEPS: readonly ProductFormStep[] = [
  "basic",
  "pricing",
  "visibility",
  "thumbnail",
  "images",
  "quantity",
];

export { MOBILE_PRODUCT_FORM_STEPS, PHYSICAL_PRODUCT_FORM_STEPS };
