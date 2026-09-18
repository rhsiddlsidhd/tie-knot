import mongoose from "mongoose";
import type { ProductDto } from "@/core/schemas/request/product.schema";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";

type CreateProductServiceInput = Omit<ProductDto, "thumbnail" | "images"> & {
  thumbnail: string;
  images: string[];
  authorId: string;
  previewUrl?: string;
};

// title은 카테고리/서브카테고리 라벨·key(예: "wedding" → "청첩장")와 겹치지 않는
// 값으로 둔다 — 겹치면 제목 검색 테스트에서 쓰는 검색어가 카테고리 역조회 조건에도
// 우연히 걸려, title 매칭만 보려던 테스트가 의도치 않게 카테고리 매칭까지
// 검증하게 된다(관리자 상품 검색 #314 작업 중 실제로 발생).
const buildProductInput = (
  overrides?: Partial<CreateProductServiceInput>,
): CreateProductServiceInput => ({
  authorId: new mongoose.Types.ObjectId().toString(),
  title: "테스트 샘플 상품",
  description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
  category: MOBILE_INVITATION_CATEGORY,
  subCategory: "wedding",
  price: 9900,
  isPremium: false,
  isFeatured: false,
  priority: 0,
  thumbnail: "https://example.com/thumbnail.jpg",
  images: [],
  minQuantity: 1,
  maxQuantity: 0,
  ...overrides,
});

export { buildProductInput };
