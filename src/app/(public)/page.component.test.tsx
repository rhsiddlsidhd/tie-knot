import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Product } from "@/core/domain/product";

const { getPopularProductsServiceMock } = vi.hoisted(() => ({
  getPopularProductsServiceMock: vi.fn(),
}));

vi.mock("@/services/product", () => ({
  getPopularProductsService: getPopularProductsServiceMock,
}));

vi.mock("@/app/(public)/_components/HomeTemplate", () => ({
  HomeTemplate: ({ popularProducts }: { popularProducts: Product[] }) => (
    <div>Template:products={popularProducts.length}</div>
  ),
}));

import HomePage, { revalidate } from "./page";

describe("홈 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPopularProductsServiceMock.mockResolvedValue([]);
  });

  it("10분 ISR 주기를 사용한다", () => {
    expect(revalidate).toBe(600);
  });

  it("인기 상품만 조회해 Template에 전달한다", async () => {
    getPopularProductsServiceMock.mockResolvedValue([
      { _id: "product-1" } as Product,
    ]);

    render(await HomePage());

    expect(getPopularProductsServiceMock).toHaveBeenCalledOnce();
    expect(screen.getByText("Template:products=1")).toBeInTheDocument();
  });

  it("인기 상품 조회가 실패해도 빈 목록으로 렌더링한다", async () => {
    getPopularProductsServiceMock.mockRejectedValue(new Error("boom"));

    render(await HomePage());

    expect(screen.getByText("Template:products=0")).toBeInTheDocument();
  });
});
