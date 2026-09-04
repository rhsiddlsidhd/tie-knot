import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Product } from "@/core/domain/product";
import type { PublicProductListPage } from "@/core/domain/product";

const { useSWRInfiniteMock, usePremiumFeatureMock } = vi.hoisted(() => ({
  useSWRInfiniteMock: vi.fn(),
  usePremiumFeatureMock: vi.fn(),
}));

vi.mock("swr/infinite", () => ({ default: useSWRInfiniteMock }));
vi.mock("@/ui/fetcher", () => ({ fetcher: vi.fn() }));
vi.mock("@/ui/hooks/usePremiumFeatures", () => ({
  usePremiumFeature: usePremiumFeatureMock,
}));

vi.mock("@/app/(main)/(products)/products/[category]/_components/ProductCatalog", () => ({
  ProductCatalog: ({
    products,
    category,
    premiumFeatures,
    availableSubCategories,
    subCategory,
    hasMore,
    isLoadingMore,
  }: {
    products: { title: string }[];
    category: string;
    premiumFeatures: { label: string }[];
    availableSubCategories: string[];
    subCategory: string;
    hasMore: boolean;
    isLoadingMore: boolean;
  }) => (
    <div>
      <span data-testid="category">{category}</span>
      <span data-testid="sub-category">{subCategory}</span>
      <span data-testid="available-sub-categories">
        {availableSubCategories.join(",")}
      </span>
      <span data-testid="premium-count">{premiumFeatures.length}</span>
      <span data-testid="has-more">{String(hasMore)}</span>
      <span data-testid="is-loading-more">{String(isLoadingMore)}</span>
      {products.map((p) => (
        <div key={p.title}>{p.title}</div>
      ))}
    </div>
  ),
}));

import { ProductCatalog } from "./ProductCatalog";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";

const buildProduct = (overrides?: Partial<Product>): Product =>
  ({ title: "봄맞이 청첩장", ...overrides }) as Product;

const buildPage = (
  overrides?: Partial<PublicProductListPage>,
): PublicProductListPage => ({
  items: [buildProduct()],
  nextCursor: null,
  ...overrides,
});

describe("ProductCatalog (container)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePremiumFeatureMock.mockReturnValue({ premiumFeatures: [] });
  });

  it("firstPage를 fallbackData로 useSWRInfinite에 넘기고, 누적된 모든 페이지의 items를 View에 전달한다", () => {
    useSWRInfiniteMock.mockReturnValue({
      data: undefined,
      size: 1,
      setSize: vi.fn(),
      isValidating: false,
    });

    const firstPage = buildPage({ items: [buildProduct()], nextCursor: "cursor-1" });

    render(
      <ProductCatalog
        firstPage={firstPage}
        category={MOBILE_INVITATION_CATEGORY}
        availableSubCategories={["wedding"]}
        initialSubCategory="wedding"
      />,
    );

    expect(screen.getByTestId("category")).toHaveTextContent(MOBILE_INVITATION_CATEGORY);
    expect(screen.getByTestId("sub-category")).toHaveTextContent("wedding");
    expect(screen.getByTestId("available-sub-categories")).toHaveTextContent("wedding");
    expect(screen.getByTestId("has-more")).toHaveTextContent("true");
    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();

    expect(useSWRInfiniteMock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({
        fallbackData: [firstPage],
        revalidateFirstPage: false,
        revalidateOnMount: false,
      }),
    );
  });

  it("SWR이 여러 페이지를 반환하면 items를 flatMap으로 누적한다", () => {
    useSWRInfiniteMock.mockReturnValue({
      data: [
        buildPage({ items: [buildProduct({ title: "1페이지" })], nextCursor: "cursor-2" }),
        buildPage({ items: [buildProduct({ title: "2페이지" })], nextCursor: null }),
      ],
      size: 2,
      setSize: vi.fn(),
      isValidating: false,
    });

    render(
      <ProductCatalog
        firstPage={buildPage()}
        category={MOBILE_INVITATION_CATEGORY}
        availableSubCategories={[]}
        initialSubCategory="all"
      />,
    );

    expect(screen.getByText("1페이지")).toBeInTheDocument();
    expect(screen.getByText("2페이지")).toBeInTheDocument();
    expect(screen.getByTestId("has-more")).toHaveTextContent("false");
  });

  it("getKey는 첫 페이지에서 category/subCategory 쿼리를 담은 key를 만든다", () => {
    useSWRInfiniteMock.mockReturnValue({
      data: undefined,
      size: 1,
      setSize: vi.fn(),
      isValidating: false,
    });

    render(
      <ProductCatalog
        firstPage={buildPage()}
        category="favor"
        availableSubCategories={["candle"]}
        initialSubCategory="candle"
      />,
    );

    const getKey = useSWRInfiniteMock.mock.calls[0][0] as (
      pageIndex: number,
      previousPage: PublicProductListPage | null,
    ) => string | null;

    expect(getKey(0, null)).toBe("/api/products?category=favor&subCategory=candle");
  });

  it("getKey는 이전 페이지의 nextCursor를 다음 페이지 key에 담고, nextCursor가 없으면 null을 리턴한다", () => {
    useSWRInfiniteMock.mockReturnValue({
      data: undefined,
      size: 1,
      setSize: vi.fn(),
      isValidating: false,
    });

    render(
      <ProductCatalog
        firstPage={buildPage()}
        category={MOBILE_INVITATION_CATEGORY}
        availableSubCategories={[]}
        initialSubCategory="all"
      />,
    );

    const getKey = useSWRInfiniteMock.mock.calls[0][0] as (
      pageIndex: number,
      previousPage: PublicProductListPage | null,
    ) => string | null;

    expect(getKey(1, buildPage({ nextCursor: "cursor-9" }))).toBe(
      `/api/products?category=${MOBILE_INVITATION_CATEGORY}&cursor=cursor-9`,
    );
    expect(getKey(1, buildPage({ nextCursor: null }))).toBeNull();
  });
});
