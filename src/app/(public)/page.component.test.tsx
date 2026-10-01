import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Product } from "@/core/domain/product";
import type { AvailableSubCategory } from "@/core/domain/product-category";

const { getPopularProductsServiceMock, getAvailableSubCategoriesServiceMock } =
  vi.hoisted(() => ({
    getPopularProductsServiceMock: vi.fn(),
    getAvailableSubCategoriesServiceMock: vi.fn(),
  }));

vi.mock("@/services/product", () => ({
  getPopularProductsService: getPopularProductsServiceMock,
  getAvailableSubCategoriesService: getAvailableSubCategoriesServiceMock,
}));

vi.mock("@/app/(public)/_components/HomeTemplate", () => ({
  HomeTemplate: ({
    popularProducts,
    availableSubCategories,
  }: {
    popularProducts: Product[];
    availableSubCategories: AvailableSubCategory[] | null;
  }) => (
    <div>
      Template:products={popularProducts.length}:subCategories=
      {availableSubCategories === null
        ? "fallback"
        : availableSubCategories
            .map(({ subCategory }) => subCategory)
            .join(",")}
    </div>
  ),
}));

import HomePage, { revalidate } from "./page";

describe("홈 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPopularProductsServiceMock.mockResolvedValue([]);
    getAvailableSubCategoriesServiceMock.mockResolvedValue([]);
  });

  it("10분 ISR 주기를 사용한다", () => {
    expect(revalidate).toBe(600);
  });

  it("인기 상품과 공개 서브카테고리를 조회해 Template에 전달한다", async () => {
    getPopularProductsServiceMock.mockResolvedValue([
      { _id: "product-1" } as Product,
    ]);
    getAvailableSubCategoriesServiceMock.mockResolvedValue([
      { category: "mobile-invitation", subCategory: "wedding" },
    ] satisfies AvailableSubCategory[]);

    render(await HomePage());

    expect(getPopularProductsServiceMock).toHaveBeenCalledOnce();
    expect(getAvailableSubCategoriesServiceMock).toHaveBeenCalledOnce();
    expect(
      screen.getByText(/Template:products=1:subCategories=wedding/),
    ).toBeInTheDocument();
  });

  it("인기 상품 조회가 실패해도 빈 목록으로 렌더링한다", async () => {
    getPopularProductsServiceMock.mockRejectedValue(new Error("boom"));

    render(await HomePage());

    expect(screen.getByText(/Template:products=0/)).toBeInTheDocument();
  });

  it("서브카테고리 조회가 실패하면 null을 넘겨 정적 폴백에 맡긴다", async () => {
    getAvailableSubCategoriesServiceMock.mockRejectedValue(new Error("boom"));

    render(await HomePage());

    expect(screen.getByText(/subCategories=\s*fallback/)).toBeInTheDocument();
  });
});
