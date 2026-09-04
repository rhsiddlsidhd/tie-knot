import type { ProductPriceType, ProductSortType } from "@/core/domain/product";

// subCategory는 여기 없다 — URL searchParams가 소유한다(_components/ProductFilters.tsx
// 참고). 이 state는 URL과 무관한 순수 클라이언트 필터(검색어/정렬/가격/특별옵션)만 다룬다.
export type ProductFilterState = {
  keyword: string;
  isOpen: boolean;
  sortBy: ProductSortType;
  price: ProductPriceType;
  premiumFeat: string[];
};

export type ProductFilterAction =
  | { type: "CHANGE_KEYWORD"; payload: string }
  | { type: "OPEN_SUGGESTIONS" }
  | { type: "CLOSE_SUGGESTIONS" }
  | { type: "SELECT_SORT_BY"; payload: ProductFilterState["sortBy"] }
  | { type: "SELECT_PRICE"; payload: ProductFilterState["price"] }
  | {
      type: "SELECT_PREMIUM_FEAT";
      payload: ProductFilterState["premiumFeat"][number];
    }
  | { type: "CLEAR_DETAIL_FILTER"; payload: null }
  | { type: "RESET_ALL" };
