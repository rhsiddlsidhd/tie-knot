import mongoose from "mongoose";
import type { CreateOrderDto } from "@/core/schemas/request/order.schema";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";

export const buildOrderInput = (
  overrides?: Partial<CreateOrderDto & { userId: string }>,
): CreateOrderDto & { userId: string } => ({
  userId: new mongoose.Types.ObjectId().toString(),
  buyerName: "김철수",
  buyerEmail: "buyer@example.com",
  buyerPhone: "010-1234-5678",
  payMethod: "CARD",
  discountRate: 0,
  discountAmount: 0,
  product: {
    productId: new mongoose.Types.ObjectId().toString(),
    title: "봄맞이 청첩장",
    thumbnail: "https://example.com/thumbnail.jpg",
    // 기본값은 배송이 필요 없는 카테고리로 둔다 — 배송 관련 테스트가 아닌
    // 대다수 기존 테스트가 shipping fixture 없이도 그대로 통과하게 하기 위함.
    category: MOBILE_INVITATION_CATEGORY,
    pricing: { originalPrice: 9900, discountedPrice: 9900 },
    quantity: 1,
    selectedFeatures: [],
  },
  ...overrides,
});
