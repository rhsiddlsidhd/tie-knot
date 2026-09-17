import type { MobileInvitationTheme } from "./theme";
import type { ProductCategory, SubCategory } from "./product-category";
import type { CursorPage } from "./cursor";

// 0. Home 인기 상품 섹션(좋아요순 Top N) 관련 상수 — service 기본값과 UI 노출 게이트가 같은 값을 본다.
const POPULAR_PRODUCTS_LIMIT = 8;
const POPULAR_PRODUCTS_MIN_ITEMS = 3;

const PRODUCT_STATUSES = ["active", "inactive", "soldOut", "deleted"] as const;

type ProductStatus = (typeof PRODUCT_STATUSES)[number];

// deleted는 삭제/복구 전용 흐름이 deletedAt과 함께 관리한다. 일반 상태 변경에서
// status만 deleted로 바꾸면 휴지통 조회 기준과 어긋나므로 선택 가능한 상태에서 제외한다.
const EDITABLE_PRODUCT_STATUSES = [
  "active",
  "inactive",
  "soldOut",
] as const satisfies readonly ProductStatus[];

type EditableProductStatus = (typeof EDITABLE_PRODUCT_STATUSES)[number];

const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: "판매중",
  inactive: "비활성",
  soldOut: "품절",
  deleted: "삭제됨",
};

const EDITABLE_PRODUCT_STATUS_OPTIONS: ReadonlyArray<
  Readonly<{ value: EditableProductStatus; label: string }>
> = EDITABLE_PRODUCT_STATUSES.map((value) => ({
  value,
  label: PRODUCT_STATUS_LABELS[value],
}));

const DISCOUNT_TYPE = {
  RATE: "rate",
  AMOUNT: "amount",
} as const;

const DISCOUNT_TYPES = [DISCOUNT_TYPE.RATE, DISCOUNT_TYPE.AMOUNT] as const;

type DiscountType = (typeof DISCOUNT_TYPES)[number];

interface Discount {
  discountType: DiscountType;
  value: number;
}

interface ProductJson {
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
  discount: Discount;
  status: ProductStatus;
  images: string[];
  minQuantity: number;
  maxQuantity: number;
  // Review 컬렉션 aggregate 결과 캐시 — 리뷰 write마다 services/review.ts가 재계산해 갱신한다.
  ratingAverage: number;
  ratingCount: number;
  previewUrl?: string;
  theme?: MobileInvitationTheme;
  isLiked: boolean;
  discountedPrice: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

type Product = ProductJson;

type AdminProductListPage = CursorPage<ProductJson>;

type PublicProductListPage = CursorPage<ProductJson>;

// 1. 필터 키 배열 정의 (UI 노출 순서 보장 및 타입 추출용)
const PRODUCT_SORT_KEYS = [
  "ALL",
  "POPULAR",
  "RECOMENDED",
  "LATEST",
  "PRICE_LOW",
  "PRICE_HIGH",
] as const;

const PRODUCT_PRICE_KEYS = [
  "ALL",
  "FREE",
  "UNDER-10k",
  "10k-30k",
  "OVER-30k",
] as const;

// 2. 각 키에 대응하는 라벨 정의 (Record 활용으로 누락 방지)
const PRODUCT_SORT_OPTIONS: Record<ProductSortType, string> = {
  ALL: "모두",
  POPULAR: "인기순",
  RECOMENDED: "추천순",
  LATEST: "최신순",
  PRICE_LOW: "낮은 가격순",
  PRICE_HIGH: "높은 가격순",
};

const PRODUCT_PRICE_OPTIONS: Record<ProductPriceType, string> = {
  ALL: "모두",
  FREE: "무료",
  "UNDER-10k": "1만원 이하",
  "10k-30k": "1만원 이상 3만원 이하",
  "OVER-30k": "3만원 이상",
};

// 3. 타입은 배열로부터 파생
type ProductSortType = (typeof PRODUCT_SORT_KEYS)[number];
type ProductPriceType = (typeof PRODUCT_PRICE_KEYS)[number];

export {
  POPULAR_PRODUCTS_LIMIT,
  POPULAR_PRODUCTS_MIN_ITEMS,
  PRODUCT_STATUSES,
  EDITABLE_PRODUCT_STATUSES,
  PRODUCT_STATUS_LABELS,
  EDITABLE_PRODUCT_STATUS_OPTIONS,
  DISCOUNT_TYPE,
  DISCOUNT_TYPES,
  PRODUCT_SORT_KEYS,
  PRODUCT_PRICE_KEYS,
  PRODUCT_SORT_OPTIONS,
  PRODUCT_PRICE_OPTIONS,
  type DiscountType,
  type Discount,
  type ProductStatus,
  type EditableProductStatus,
  type ProductJson,
  type Product,
  type AdminProductListPage,
  type PublicProductListPage,
  type ProductSortType,
  type ProductPriceType,
};
