import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Product, PublicProductListPage } from "@/core/domain/product";
import type { AvailableSubCategory } from "@/core/domain/product-category";

const {
  getPopularProductsServiceMock,
  getAvailableSubCategoriesServiceMock,
  getPublicProductsPageServiceMock,
} = vi.hoisted(() => ({
  getPopularProductsServiceMock: vi.fn(),
  getAvailableSubCategoriesServiceMock: vi.fn(),
  getPublicProductsPageServiceMock: vi.fn(),
}));

vi.mock("@/services/product", () => ({
  getPopularProductsService: getPopularProductsServiceMock,
  getAvailableSubCategoriesService: getAvailableSubCategoriesServiceMock,
  getPublicProductsPageService: getPublicProductsPageServiceMock,
}));

vi.mock("@/app/(public)/_components/HomeTemplate", () => ({
  HomeTemplate: ({
    popularProducts,
    availableSubCategories,
    liveDemoThumbnail,
  }: {
    popularProducts: Product[];
    availableSubCategories: AvailableSubCategory[];
    liveDemoThumbnail: string | null;
  }) => (
    <div>
      Template:products={popularProducts.length}:subCategories=
      {availableSubCategories.length}:thumbnail={String(liveDemoThumbnail)}
    </div>
  ),
}));

import HomePage from "./page";

const emptyProductPage: PublicProductListPage = { items: [], nextCursor: null };

describe("홈 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPopularProductsServiceMock.mockResolvedValue([]);
    getAvailableSubCategoriesServiceMock.mockResolvedValue([]);
    getPublicProductsPageServiceMock.mockResolvedValue(emptyProductPage);
  });

  it("모바일 청첩장 카테고리에서 blossom 테마 상품 1건을 조회한다", async () => {
    await HomePage();

    expect(getPublicProductsPageServiceMock).toHaveBeenCalledWith({
      category: "mobile-invitation",
      theme: "blossom",
      limit: 1,
    });
  });

  it("조회된 blossom 테마 상품의 썸네일을 Template에 전달한다", async () => {
    getPublicProductsPageServiceMock.mockResolvedValue({
      items: [{ _id: "1", theme: "blossom", thumbnail: "/blossom.webp" }],
      nextCursor: null,
    } as unknown as PublicProductListPage);

    render(await HomePage());

    expect(
      screen.getByText(
        "Template:products=0:subCategories=0:thumbnail=/blossom.webp",
      ),
    ).toBeInTheDocument();
  });

  it("blossom 테마 상품이 없으면 썸네일로 null을 전달한다", async () => {
    render(await HomePage());

    expect(
      screen.getByText("Template:products=0:subCategories=0:thumbnail=null"),
    ).toBeInTheDocument();
  });

  it("상품 조회가 실패해도 페이지 렌더링은 null 썸네일로 계속된다", async () => {
    getPublicProductsPageServiceMock.mockRejectedValue(new Error("boom"));

    render(await HomePage());

    expect(
      screen.getByText("Template:products=0:subCategories=0:thumbnail=null"),
    ).toBeInTheDocument();
  });
});
