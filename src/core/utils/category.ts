import type { ProductCategory, SubCategory } from "@/core/domain";
import {
  MOBILE_INVITATION_CATEGORY,
  SUB_CATEGORY_MAP,
  productCategoryLabels,
  subCategoryLabels,
} from "@/core/domain";

// 모바일초대장만 배송이 필요 없는 유일한 카테고리다 — 이 판단을 쓰는 모든
// 레이어(클라이언트 폼/서비스 검증/DB conditional required)가 이 함수 하나로
// 수렴해야 카테고리 추가·rename 시 한 곳만 고치면 된다.
export const categoryRequiresShipping = (
  category: ProductCategory | undefined,
): boolean => category !== MOBILE_INVITATION_CATEGORY;

export const isProductCategory = (value: string): value is ProductCategory => {
  return Object.keys(productCategoryLabels).includes(value);
};

export const isSubCategory = (value: string): value is SubCategory => {
  return Object.keys(subCategoryLabels).includes(value);
};

export const getCategoryOptions = (includeAll = false) => {
  const allOption = includeAll
    ? [{ value: "all" as const, label: "전체" }]
    : [];
  return [
    ...allOption,
    ...Object.entries(productCategoryLabels).map(([value, label]) => ({
      value: value as ProductCategory,
      label,
    })),
  ];
};

export const getSubCategoryOptions = (
  category: ProductCategory,
  includeAll = false,
) => {
  const allOption = includeAll
    ? [{ value: "all" as const, label: "전체" }]
    : [];
  const options = SUB_CATEGORY_MAP[category].map((value) => ({
    value,
    label: subCategoryLabels[value],
  }));
  return [...allOption, ...options];
};

export const getAvailableSubCategories = (
  category: ProductCategory,
  products: readonly { category: string; subCategory: string }[],
): SubCategory[] => {
  const availableSubCategories = new Set(
    products
      .filter((product) => product.category === category)
      .map((product) => product.subCategory),
  );

  return SUB_CATEGORY_MAP[category].filter((subCategory) =>
    availableSubCategories.has(subCategory),
  );
};

// 라벨 역조회 최소 길이 — 1글자는 오탐이 지나치다(예: "비" 하나로 "비즈니스" 전체가 딸려옴).
const LABEL_MATCH_MIN_LENGTH = 2;

// 검색어가 라벨 또는 enum key에 부분일치하는 카테고리 key들을 돌려준다 (대소문자 무시).
export const findProductCategoriesByTerm = (
  term: string,
): ProductCategory[] => {
  const normalized = term.trim().toLowerCase();
  if (normalized.length < LABEL_MATCH_MIN_LENGTH) return [];

  return (Object.entries(productCategoryLabels) as [ProductCategory, string][])
    .filter(
      ([key, label]) =>
        label.toLowerCase().includes(normalized) ||
        key.toLowerCase().includes(normalized),
    )
    .map(([key]) => key);
};

// 검색어가 라벨 또는 enum key에 부분일치하는 서브카테고리 key들을 돌려준다 (대소문자 무시).
export const findSubCategoriesByTerm = (term: string): SubCategory[] => {
  const normalized = term.trim().toLowerCase();
  if (normalized.length < LABEL_MATCH_MIN_LENGTH) return [];

  return (Object.entries(subCategoryLabels) as [SubCategory, string][])
    .filter(
      ([key, label]) =>
        label.toLowerCase().includes(normalized) ||
        key.toLowerCase().includes(normalized),
    )
    .map(([key]) => key);
};
