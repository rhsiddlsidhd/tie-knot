import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Product } from "@/core/domain/product";

vi.mock("../_containers/ProductTableRowAction", () => ({
  ProductTableRowAction: (): null => null,
}));

vi.mock("../_containers/ProductTableRowSelect", () => ({
  ProductTableRowSelect: (): null => null,
}));

import { ProductTableRow } from "./ProductTableRow";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";

const buildProduct = (overrides?: Partial<Product>): Product =>
  ({
    _id: "507f1f77bcf86cd799439011",
    authorId: "507f1f77bcf86cd799439012",
    title: "봄맞이 청첩장",
    description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
    thumbnail: "https://example.com/thumbnail.jpg",
    price: 9900,
    category: MOBILE_INVITATION_CATEGORY,
    subCategory: "wedding",
    isPremium: false,
    featureIds: [],
    isFeatured: false,
    priority: 3,
    likes: ["u1", "u2"],
    views: 120,
    salesCount: 7,
    discount: { discountType: "rate", value: 0 },
    status: "active",
    theme: "default",
    isLiked: false,
    discountedPrice: 9900,
    images: [],
    minQuantity: 1,
    maxQuantity: 0,
    createdAt: "2026-09-01T03:00:00.000Z",
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    ...overrides,
  }) as Product;

describe("ProductTableRow", () => {
  it("카테고리/서브카테고리 라벨과 상품 정보를 렌더링한다", () => {
    render(
      <table>
        <tbody>
          <ProductTableRow
            product={buildProduct()}
            view="active"
            onRefreshed={vi.fn()}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
    expect(screen.getByText("모바일초대장")).toBeInTheDocument();
    expect(screen.getByText("청첩장")).toBeInTheDocument();
    expect(screen.getByText("9,900원")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("프리미엄/추천 배지는 해당 플래그가 true일 때만 렌더링한다", () => {
    render(
      <table>
        <tbody>
          <ProductTableRow
            product={buildProduct({ isPremium: true, isFeatured: true })}
            view="active"
            onRefreshed={vi.fn()}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText("프리미엄")).toBeInTheDocument();
    expect(screen.getByText("추천")).toBeInTheDocument();
  });

  it("프리미엄/추천이 아니면 해당 배지를 렌더링하지 않는다", () => {
    render(
      <table>
        <tbody>
          <ProductTableRow
            product={buildProduct()}
            view="active"
            onRefreshed={vi.fn()}
          />
        </tbody>
      </table>,
    );

    expect(screen.queryByText("프리미엄")).not.toBeInTheDocument();
    expect(screen.queryByText("추천")).not.toBeInTheDocument();
  });

  it("조회수·좋아요·판매량을 각각의 칸에, 등록일을 우선순위 뒤 칸에 렌더링한다", () => {
    render(
      <table>
        <tbody>
          <ProductTableRow
            product={buildProduct()}
            view="active"
            onRefreshed={vi.fn()}
          />
        </tbody>
      </table>,
    );

    const cells = screen.getAllByRole("cell");
    expect(cells).toHaveLength(12);
    expect(cells.slice(6, 11).map((cell) => cell.textContent)).toEqual([
      "120",
      "2",
      "7",
      "3",
      "2026.9.1",
    ]);
  });

  it("휴지통 view면 상태 칸에 삭제 배지와 삭제일을 렌더링한다", () => {
    render(
      <table>
        <tbody>
          <ProductTableRow
            product={buildProduct({ deletedAt: "2026-09-10T03:00:00.000Z" })}
            view="trash"
            onRefreshed={vi.fn()}
          />
        </tbody>
      </table>,
    );

    const statusCell = screen.getAllByRole("cell")[5];
    expect(statusCell).toHaveTextContent("삭제됨");
    expect(statusCell).toHaveTextContent(
      new Date("2026-09-10T03:00:00.000Z").toLocaleDateString("ko-KR"),
    );
  });
});
