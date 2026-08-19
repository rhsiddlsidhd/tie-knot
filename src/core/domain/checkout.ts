import type { SelectFeatureDto } from "@/core/schemas";

export interface CheckoutItem {
  productId: string;

  title: string;
  thumbnail: string;

  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  optionsTotalPrice: number;
  finalPrice: number;

  quantity: number;
  selectedFeatures: SelectFeatureDto[];
}
