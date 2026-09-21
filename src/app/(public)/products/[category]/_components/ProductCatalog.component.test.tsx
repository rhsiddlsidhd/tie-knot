import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { RefObject } from "react";
import type { Product } from "@/core/domain/product";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import type { SubCategory } from "@/core/domain/product-category";
import { ProductCatalog } from "./ProductCatalog";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";

// ProductCatalog는 내부적으로 ProductFilters를 렌더링하고, ProductFilters는
// subCategory 탭 클릭 시 router.push를 쓴다(useRouter) — app router 없이 렌더링하는
// 이 component test에서는 next/navigation을 mock한다.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const buildProduct = (overrides?: Partial<Product>): Product =>
  ({
    _id: "product-1",
    authorId: "author-1",
    title: "봄맞이 청첩장",
    description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
    thumbnail: "https://example.com/thumb.jpg",
    price: 10000,
    category: MOBILE_INVITATION_CATEGORY,
    subCategory: "wedding",
    isPremium: false,
    isFeatured: false,
    priority: 0,
    discount: { discountType: "rate", value: 0 },
    status: "active",
    likes: [],
    featureIds: [],
    isLiked: false,
    discountedPrice: 10000,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  }) as Product;

// category는 object spread({...defaultProps})를 거치면 리터럴 타입이 string으로
// widen되는 TS의 알려진 동작(as const로 태그된 값만 spread에서 좁은 타입을 유지) 때문에
// 상수 참조 대신 리터럴에 직접 as const를 건다.
const defaultProps = {
  category: "mobile-invitation" as const,
  premiumFeatures: [] as PremiumFeature[],
  availableSubCategories: [] as SubCategory[],
  subCategory: "all" as const,
  hasMore: false,
  isLoadingMore: false,
  sentinelRef: { current: null } as RefObject<HTMLDivElement | null>,
};

describe("ProductCatalog", () => {
  it("검색창과 상품 카드를 함께 렌더링한다", () => {
    render(<ProductCatalog products={[buildProduct()]} {...defaultProps} />);

    expect(screen.getByPlaceholderText("상품 검색...")).toBeInTheDocument();
    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
  });

  it("products는 이미 서버가 subCategory로 필터링한 값이라 그대로 전부 렌더링한다", () => {
    render(
      <ProductCatalog
        products={[
          buildProduct({ title: "봄맞이 청첩장", subCategory: "wedding" }),
          buildProduct({ _id: "product-2", title: "또 다른 청첩장", subCategory: "wedding" }),
        ]}
        {...defaultProps}
        subCategory="wedding"
        availableSubCategories={["wedding", "first-birthday"]}
      />,
    );

    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
    expect(screen.getByText("또 다른 청첩장")).toBeInTheDocument();
  });

  it("hasMore가 true면 더보기 sentinel을 렌더링한다", () => {
    render(
      <ProductCatalog
        products={[buildProduct()]}
        {...defaultProps}
        hasMore={true}
      />,
    );

    expect(screen.getByTestId("load-more-sentinel")).toBeInTheDocument();
  });

  it("hasMore가 false면 더보기 sentinel을 렌더링하지 않는다", () => {
    render(
      <ProductCatalog products={[buildProduct()]} {...defaultProps} hasMore={false} />,
    );

    expect(screen.queryByTestId("load-more-sentinel")).not.toBeInTheDocument();
  });

  it("isLoadingMore가 true면 불러오는 중 안내 문구를 렌더링한다", () => {
    render(
      <ProductCatalog
        products={[buildProduct()]}
        {...defaultProps}
        hasMore={true}
        isLoadingMore={true}
      />,
    );

    expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
  });
});
