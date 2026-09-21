import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Product } from "@/core/domain/product";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import type { ReviewListPage } from "@/core/domain/review";

const {
  getAuthMock,
  getPremiumFeatureServiceMock,
  getProductReviewsPageServiceMock,
  getProductServiceMock,
  notFoundMock,
} = vi.hoisted(() => ({
  getAuthMock: vi.fn(),
  getPremiumFeatureServiceMock: vi.fn(),
  getProductReviewsPageServiceMock: vi.fn(),
  getProductServiceMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/services/auth", () => ({
  getAuth: getAuthMock,
}));
vi.mock("@/services/premiumFeature", () => ({
  getPremiumFeatureService: getPremiumFeatureServiceMock,
}));
vi.mock("@/services/review", () => ({
  getProductReviewsPageService: getProductReviewsPageServiceMock,
}));
vi.mock("@/services/product", () => ({
  getProductService: getProductServiceMock,
}));
vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock(
  "@/app/(public)/products/[category]/[id]/_components/ProductDetailTemplate",
  () => ({
    ProductDetailTemplate: ({
      product,
      options,
      reviews,
      sort,
    }: {
      product: Product;
      options: PremiumFeature[];
      reviews: ReviewListPage;
      sort: string;
    }) => (
      <div>
        Template:title={product.title}:options={options.length}:reviews=
        {reviews.items.length}:sort={sort}
      </div>
    ),
  }),
);

import ProductDetailPage from "./page";

const buildProduct = (overrides?: Partial<Product>): Product =>
  ({
    _id: "product-1",
    authorId: "author-1",
    title: "봄맞이 청첩장",
    description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
    thumbnail: "https://example.com/thumb.jpg",
    price: 10000,
    category: "mobile-invitation",
    subCategory: "wedding",
    isPremium: false,
    isFeatured: false,
    priority: 0,
    discount: { discountType: "rate", value: 0 },
    status: "active",
    likes: [],
    featureIds: ["feature-1"],
    isLiked: false,
    discountedPrice: 10000,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  }) as Product;

const emptyReviews: ReviewListPage = { items: [], nextCursor: null };

const buildParams = () =>
  Promise.resolve({ category: "mobile-invitation", id: "product-1" });
const buildSearchParams = (
  value: Record<string, string | string[] | undefined> = {},
) => Promise.resolve(value);

describe("상품 상세 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthMock.mockResolvedValue(null);
    getPremiumFeatureServiceMock.mockResolvedValue([]);
    getProductReviewsPageServiceMock.mockResolvedValue(emptyReviews);
  });

  it("상품이 없으면 notFound를 호출하고 이후 옵션/리뷰 조회는 하지 않는다", async () => {
    getProductServiceMock.mockResolvedValue(null);

    await expect(
      ProductDetailPage({
        params: buildParams(),
        searchParams: buildSearchParams(),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(getPremiumFeatureServiceMock).not.toHaveBeenCalled();
    expect(getProductReviewsPageServiceMock).not.toHaveBeenCalled();
  });

  it("상품을 조회한 뒤 그 featureIds로 프리미엄 옵션을 조회한다", async () => {
    getProductServiceMock.mockResolvedValue(
      buildProduct({ featureIds: ["feature-1", "feature-2"] }),
    );

    await ProductDetailPage({
      params: buildParams(),
      searchParams: buildSearchParams(),
    });

    expect(getProductServiceMock).toHaveBeenCalledWith("product-1");
    expect(getPremiumFeatureServiceMock).toHaveBeenCalledWith([
      "feature-1",
      "feature-2",
    ]);
  });

  it("로그인 세션이 있으면 viewerUserId를 포함해 리뷰를 조회한다", async () => {
    getProductServiceMock.mockResolvedValue(buildProduct());
    getAuthMock.mockResolvedValue({
      role: "USER",
      email: "a@x.com",
      userId: "user-1",
    });

    await ProductDetailPage({
      params: buildParams(),
      searchParams: buildSearchParams(),
    });

    expect(getProductReviewsPageServiceMock).toHaveBeenCalledWith({
      productId: "product-1",
      sort: "LATEST",
      cursor: undefined,
      viewerUserId: "user-1",
    });
  });

  it("세션이 없으면 viewerUserId 없이 리뷰를 조회한다", async () => {
    getProductServiceMock.mockResolvedValue(buildProduct());

    await ProductDetailPage({
      params: buildParams(),
      searchParams: buildSearchParams(),
    });

    expect(getProductReviewsPageServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ viewerUserId: undefined }),
    );
  });

  it("searchParams의 sort/reviewCursor를 검증해 리뷰 조회에 그대로 전달한다", async () => {
    getProductServiceMock.mockResolvedValue(buildProduct());

    await ProductDetailPage({
      params: buildParams(),
      searchParams: buildSearchParams({
        sort: "RATING_HIGH",
        reviewCursor: "cursor-abc",
      }),
    });

    expect(getProductReviewsPageServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ sort: "RATING_HIGH", cursor: "cursor-abc" }),
    );
  });

  it("sort가 없으면 LATEST를 기본값으로 사용한다", async () => {
    getProductServiceMock.mockResolvedValue(buildProduct());

    await ProductDetailPage({
      params: buildParams(),
      searchParams: buildSearchParams(),
    });

    expect(getProductReviewsPageServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ sort: "LATEST" }),
    );
  });

  it("조회한 상품/옵션/리뷰/정렬을 Template props로 전달한다", async () => {
    getProductServiceMock.mockResolvedValue(
      buildProduct({ title: "봄맞이 청첩장" }),
    );
    getPremiumFeatureServiceMock.mockResolvedValue([
      {
        _id: "feature-1",
        code: "CUSTOM_FONT",
        label: "나만의 폰트",
        description: "",
        additionalPrice: 0,
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ] as PremiumFeature[]);
    getProductReviewsPageServiceMock.mockResolvedValue({
      items: [
        {
          _id: "review-1",
          productId: "product-1",
          authorName: "김*준",
          rating: 5,
          content: "좋아요",
          images: [],
          isOwner: false,
          createdAt: new Date("2026-08-20T00:00:00.000Z"),
          updatedAt: new Date("2026-08-20T00:00:00.000Z"),
        },
      ],
      nextCursor: null,
    } satisfies ReviewListPage);

    render(
      await ProductDetailPage({
        params: buildParams(),
        searchParams: buildSearchParams({ sort: "RATING_HIGH" }),
      }),
    );

    expect(
      screen.getByText(
        "Template:title=봄맞이 청첩장:options=1:reviews=1:sort=RATING_HIGH",
      ),
    ).toBeInTheDocument();
  });
});
