// ---- 값이 원본 ----
export const PRODUCT_CATEGORIES = [
  "invitation",
  "favor",
  "accessory",
  "guestbook",
  "ceremony",
] as const;

export const SUB_CATEGORY_MAP = {
  invitation: ["wedding", "first-birthday"],
  favor: ["candle", "diffuser", "soap", "magnet", "handkerchief", "cookie"],
  accessory: ["ring-pillow", "welcome-board", "polaroid-frame", "hairpin"],
  guestbook: ["book", "stamp"],
  ceremony: [
    "candle-holder",
    "escort-card",
    "program-book",
    "aisle-runner",
    "flower-basket",
    "envelope-set",
    "vow-book",
  ],
} as const satisfies Record<ProductCategory, readonly string[]>;

export const productCategoryLabels: Record<ProductCategory, string> = {
  invitation: "초대장",
  favor: "답례품",
  accessory: "웨딩소품",
  guestbook: "방명록 굿즈",
  ceremony: "예식 용품",
};

export const subCategoryLabels: Record<SubCategory, string> = {
  wedding: "청첩장",
  "first-birthday": "돌잔치",
  candle: "캔들",
  diffuser: "디퓨저",
  soap: "비누",
  magnet: "마그넷",
  handkerchief: "손수건",
  "ring-pillow": "링필로우",
  "welcome-board": "웰컴보드",
  "polaroid-frame": "폴라로이드 액자",
  book: "방명록",
  stamp: "스탬프",
  "candle-holder": "캔들홀더",
  "escort-card": "에스코트 카드",
  "program-book": "예식 순서지",
  "aisle-runner": "아일 러너",
  cookie: "수제 쿠키 세트",
  hairpin: "진주 헤어핀 세트",
  "flower-basket": "화동 바구니",
  "envelope-set": "축의금 봉투 세트",
  "vow-book": "예식 문서 케이스 세트",
};

// ---- 타입은 파생 ----
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type SubCategory = (typeof SUB_CATEGORY_MAP)[ProductCategory][number];

export interface AvailableSubCategory {
  category: ProductCategory;
  subCategory: SubCategory;
}

export const CUSTOMER_INPUT_ROUTES: Partial<
  Record<ProductCategory, (orderId: string) => string>
> = {
  invitation: (orderId: string) => `/my-orders/${orderId}/invitation`,
};
