import type {
  InvitationTheme,
  ProductCategory,
  SubCategory,
} from "@/shared/constants";

export type ProductStatus = "active" | "inactive" | "soldOut" | "deleted";

export interface ProductJSON {
  _id: string;
  authorId: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  category: ProductCategory;
  subCategory: SubCategory;
  isPremium: boolean;
  featureIds: string[];
  isFeatured: boolean;
  priority: number;
  likes: string[];
  views: number;
  salesCount: number;
  discount: {
    discountType: "rate" | "amount";
    value: number;
  };
  status: ProductStatus;
  images: string[];
  minQuantity: number;
  maxQuantity: number;
  previewUrl?: string;
  theme?: InvitationTheme;
  isLiked: boolean;
  discountedPrice: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type Product = ProductJSON;

export interface PremiumFeature {
  _id: string;
  code: string;
  label: string;
  description: string;
  additionalPrice: number;
  isActive: boolean;
  createdAt: string;
}
