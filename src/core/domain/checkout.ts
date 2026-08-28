import type { SelectFeatureDto } from "@/core/schemas";
import type { ProductCategory } from "./product-category";

export interface CheckoutItem {
  productId: string;
  category: ProductCategory;

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
