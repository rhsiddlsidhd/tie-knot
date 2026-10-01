import type {
  AvailableSubCategory,
  SubCategory,
} from "@/core/domain/product-category";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  SUB_CATEGORY_LABELS,
  SUB_CATEGORY_MAP,
} from "@/core/domain/product-category";
import type {
  NavigationGroup,
  NavigationLinkItem,
} from "@/core/domain/navigation";
import { ROUTES } from "@/core/domain/routes";

/**
 * 카테고리 nav는 "공개 상품이 하나라도 있는 서브카테고리"만 그린다 — 정적
 * SUB_CATEGORY_MAP 전체를 그리면 상품이 없는 서브카테고리 링크가 노출되고,
 * 클릭해도 `products/[category]/page.tsx`가 그 값을 쓸 수 없어 전체 목록으로
 * 되돌린다(링크는 있는데 아무 일도 안 일어나는 것처럼 보인다).
 */
const buildCategoryNavigationItems = (
  availableSubCategories: readonly AvailableSubCategory[],
): NavigationGroup[] =>
  PRODUCT_CATEGORIES.flatMap((category): NavigationGroup[] => {
    const subCategories = availableSubCategories
      .filter((available) => available.category === category)
      .map(({ subCategory }) => subCategory);

    // 서브카테고리가 하나도 없다 = 그 카테고리에 공개 상품이 없다
    if (subCategories.length === 0) return [];

    return [
      {
        id: category,
        label: PRODUCT_CATEGORY_LABELS[category],
        icon: null,
        submenu: [
          {
            id: `${category}-all`,
            label: "전체보기",
            href: ROUTES.products.byCategory(category),
            icon: null,
          },
          ...subCategories.map(
            (subCategory): NavigationLinkItem => ({
              id: subCategory,
              label: SUB_CATEGORY_LABELS[subCategory],
              href: ROUTES.products.byCategory(category, subCategory),
              icon: null,
            }),
          ),
        ],
      },
    ];
  });

// 서브카테고리 조회가 실패했을 때 nav를 통째로 비우지 않기 위한 폴백 입력이다.
const buildAllSubCategoryPairs = (): AvailableSubCategory[] =>
  PRODUCT_CATEGORIES.flatMap((category) =>
    (SUB_CATEGORY_MAP[category] as readonly SubCategory[]).map(
      (subCategory): AvailableSubCategory => ({ category, subCategory }),
    ),
  );

/**
 * usePathname()은 쿼리를 떼고 돌려주는데 서브카테고리 링크의 href는
 * `?subCategory=`를 달고 있다 — 활성 여부는 둘을 합친 href로 비교해야 한다.
 */
const resolveActiveNavigationHref = (
  pathname: string,
  subCategory: string | null,
): string =>
  subCategory ? `${pathname}?subCategory=${subCategory}` : pathname;

export {
  buildCategoryNavigationItems,
  buildAllSubCategoryPairs,
  resolveActiveNavigationHref,
};
