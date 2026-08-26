import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { initialFilterState } from "@/ui/context/productFilter";
import type { Product } from "@/core/domain";
import { ProductGrid } from "./ProductGrid";

const buildProduct = (overrides?: Partial<Product>): Product =>
  ({
    _id: "product-1",
    authorId: "author-1",
    title: "봄맞이 청첩장",
    description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
    thumbnail: "https://example.com/thumb.jpg",
    price: 10000,
    category: "invitation",
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

describe("ProductGrid", () => {
  it("상품이 있으면 카드를 렌더링한다", () => {
    render(
      <ProductGrid data={[buildProduct()]} state={initialFilterState} dispatch={vi.fn()} />,
    );

    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
  });

  it("카테고리에 상품 자체가 없으면 '준비 중' 빈 상태를 렌더링한다(필터 초기화 버튼 없음)", () => {
    render(<ProductGrid data={[]} state={initialFilterState} dispatch={vi.fn()} />);

    expect(screen.getByText("상품을 준비 중에 있습니다")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "필터 초기화" })).not.toBeInTheDocument();
  });

  it("상품은 있지만 필터 조건에 안 맞으면 '조건에 맞는 상품 없음' 빈 상태 + 필터 초기화 버튼을 렌더링한다", () => {
    const dispatch = vi.fn();
    render(
      <ProductGrid
        data={[buildProduct()]}
        state={{ ...initialFilterState, keyword: "존재하지-않는-상품" }}
        dispatch={dispatch}
      />,
    );

    expect(screen.getByText("조건에 맞는 상품이 없어요")).toBeInTheDocument();
    const resetButton = screen.getByRole("button", { name: "필터 초기화" });
    resetButton.click();
    expect(dispatch).toHaveBeenCalledWith({ type: "RESET_ALL" });
  });

  // feat/popular-products-section 회귀: ProductGrid는 ProductCard에 rank를
  // 넘기지 않는 기존 소비처 2곳(01_ui_flow.md §5.2) 중 하나다. rank가
  // optional이라도 카드 내부에서 실수로 index 기반 rank를 흘려보내면 검색
  // 결과/카탈로그 그리드에도 순위 배지가 잘못 붙는다 — 그 무회귀를 확인한다.
  it("rank를 넘기지 않으므로 카드에 순위 배지가 렌더되지 않는다 (ProductCard rank 추가 무회귀)", () => {
    render(
      <ProductGrid
        data={[buildProduct(), buildProduct({ _id: "product-2", title: "두 번째 상품" })]}
        state={initialFilterState}
        dispatch={vi.fn()}
      />,
    );

    expect(screen.queryByText(/^인기 \d+위$/)).not.toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });
});
