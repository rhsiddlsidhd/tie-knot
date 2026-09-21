import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PublicProductListPage } from "@/core/domain/product";
import type {
  AvailableSubCategory,
  ProductCategory,
  SubCategory,
} from "@/core/domain/product-category";

const {
  getPublicProductsPageServiceMock,
  getAvailableSubCategoriesServiceMock,
  notFoundMock,
} = vi.hoisted(() => ({
  getPublicProductsPageServiceMock: vi.fn(),
  getAvailableSubCategoriesServiceMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/services/product", () => ({
  getPublicProductsPageService: getPublicProductsPageServiceMock,
  getAvailableSubCategoriesService: getAvailableSubCategoriesServiceMock,
}));
vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock(
  "@/app/(public)/products/[category]/_components/ProductCatalogTemplate",
  () => ({
    ProductCatalogTemplate: ({
      firstPage,
      category,
      categoryLabel,
      availableSubCategories,
      initialSubCategory,
    }: {
      firstPage: PublicProductListPage;
      category: ProductCategory;
      categoryLabel: string;
      availableSubCategories: SubCategory[];
      initialSubCategory: SubCategory | "all";
    }) => (
      <div>
        Template:category={category}:label={categoryLabel}:products=
        {firstPage.items.length}:available={availableSubCategories.join(",")}
        :initial=
        {initialSubCategory}
      </div>
    ),
  }),
);

import ProductsPage from "./page";

const emptyPage: PublicProductListPage = { items: [], nextCursor: null };

const buildParams = (category: string) => Promise.resolve({ category });
const buildSearchParams = (subCategory?: string | string[]) =>
  Promise.resolve({ subCategory });

const buildAvailable = (
  category: ProductCategory,
  subCategories: SubCategory[],
): AvailableSubCategory[] =>
  subCategories.map((subCategory) => ({ category, subCategory }));

describe("상품 카테고리 목록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAvailableSubCategoriesServiceMock.mockResolvedValue([]);
    getPublicProductsPageServiceMock.mockResolvedValue(emptyPage);
  });

  it("유효하지 않은 카테고리 세그먼트면 notFound를 호출하고 상품을 조회하지 않는다", async () => {
    await expect(
      ProductsPage({
        params: buildParams("invalid-category"),
        searchParams: buildSearchParams(),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getAvailableSubCategoriesServiceMock).not.toHaveBeenCalled();
    expect(getPublicProductsPageServiceMock).not.toHaveBeenCalled();
  });

  it("유효한 카테고리면 그 카테고리의 사용 가능한 서브카테고리를 조회한다", async () => {
    await ProductsPage({
      params: buildParams("mobile-invitation"),
      searchParams: buildSearchParams(),
    });

    expect(getAvailableSubCategoriesServiceMock).toHaveBeenCalledWith(
      "mobile-invitation",
    );
  });

  it("쿼리 subCategory가 사용 가능한 목록에 있으면 그 값으로 상품을 필터링해 조회한다", async () => {
    getAvailableSubCategoriesServiceMock.mockResolvedValue(
      buildAvailable("mobile-invitation", ["wedding", "first-birthday"]),
    );

    await ProductsPage({
      params: buildParams("mobile-invitation"),
      searchParams: buildSearchParams("wedding"),
    });

    expect(getPublicProductsPageServiceMock).toHaveBeenCalledWith({
      category: "mobile-invitation",
      subCategory: "wedding",
    });
  });

  it("쿼리 subCategory가 없으면 subCategory 없이 전체 상품을 조회한다", async () => {
    getAvailableSubCategoriesServiceMock.mockResolvedValue(
      buildAvailable("mobile-invitation", ["wedding"]),
    );

    await ProductsPage({
      params: buildParams("mobile-invitation"),
      searchParams: buildSearchParams(),
    });

    expect(getPublicProductsPageServiceMock).toHaveBeenCalledWith({
      category: "mobile-invitation",
      subCategory: undefined,
    });
  });

  it("쿼리 subCategory가 사용 가능한 목록에 없으면 전체 상품으로 취급한다", async () => {
    getAvailableSubCategoriesServiceMock.mockResolvedValue(
      buildAvailable("mobile-invitation", ["wedding"]),
    );

    await ProductsPage({
      params: buildParams("mobile-invitation"),
      searchParams: buildSearchParams("not-available"),
    });

    expect(getPublicProductsPageServiceMock).toHaveBeenCalledWith({
      category: "mobile-invitation",
      subCategory: undefined,
    });
  });

  it("조회한 상품/서브카테고리와 카테고리 라벨을 Template props로 전달한다", async () => {
    getAvailableSubCategoriesServiceMock.mockResolvedValue(
      buildAvailable("mobile-invitation", ["wedding", "first-birthday"]),
    );
    getPublicProductsPageServiceMock.mockResolvedValue({
      items: [
        {
          _id: "product-1",
          title: "봄맞이 청첩장",
        },
      ],
      nextCursor: null,
    } as unknown as PublicProductListPage);

    render(
      await ProductsPage({
        params: buildParams("mobile-invitation"),
        searchParams: buildSearchParams("wedding"),
      }),
    );

    expect(
      screen.getByText(
        "Template:category=mobile-invitation:label=모바일초대장:products=1:available=wedding,first-birthday:initial=wedding",
      ),
    ).toBeInTheDocument();
  });
});
