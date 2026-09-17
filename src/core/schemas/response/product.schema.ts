import * as z from "zod";
import { MOBILE_INVITATION_THEMES } from "@/core/domain/theme";
import { PRODUCT_CATEGORIES } from "@/core/domain/product-category";
import { DISCOUNT_TYPES, PRODUCT_STATUSES } from "@/core/domain/product";

const isoDateString = z.string().refine((v) => !isNaN(Date.parse(v)), {
  message: "ISO date string이 아님",
});

const ProductResponseSchema = z.object({
  _id: z.string(),
  authorId: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnail: z.string(),
  previewUrl: z.string().optional(),
  theme: z.enum(MOBILE_INVITATION_THEMES).optional(),
  price: z.number(),
  category: z.enum(PRODUCT_CATEGORIES),
  subCategory: z.string(),
  isPremium: z.boolean(),
  featureIds: z.array(z.string()),
  isFeatured: z.boolean(),
  priority: z.number(),
  likes: z.array(z.string()),
  views: z.number(),
  salesCount: z.number(),
  discount: z.object({
    discountType: z.enum(DISCOUNT_TYPES),
    value: z.number(),
  }),
  status: z.enum(PRODUCT_STATUSES),
  isLiked: z.boolean(),
  discountedPrice: z.number(),
  createdAt: isoDateString,
  updatedAt: isoDateString,
  deletedAt: isoDateString.nullable(),

  // ── 신규 (REQ-2) — 셋 다 non-optional. transformProduct 정규화가 보장한다. ──
  images: z.array(z.string()),
  minQuantity: z.number(),
  maxQuantity: z.number(),
});

const ProductsResponseSchema = z.array(ProductResponseSchema);

type ProductResponse = z.infer<typeof ProductResponseSchema>;

export { ProductResponseSchema, ProductsResponseSchema, type ProductResponse };
