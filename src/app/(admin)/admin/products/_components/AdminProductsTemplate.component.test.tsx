import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AdminProductListPage, ProductJSON } from "@/core/domain/product";

vi.mock("./ProductTableRow", () => ({
  ProductTableRow: ({ product }: { product: { title: string } }) => (
    <tr>
      <td>{product.title}</td>
    </tr>
  ),
}));

import { AdminProductsTemplate } from "./AdminProductsTemplate";

const buildProduct = (overrides?: Partial<ProductJSON>): ProductJSON =>
  ({
    _id: "product-1",
    title: "봄맞이 청첩장",
    ...overrides,
  }) as ProductJSON;

const buildPage = (
  overrides?: Partial<AdminProductListPage>,
): AdminProductListPage => ({
  items: [buildProduct()],
  nextCursor: null,
  ...overrides,
});

describe("AdminProductsTemplate", () => {
  it("상품 목록과 테이블 헤더를 렌더링한다", () => {
    render(<AdminProductsTemplate page={buildPage()} />);

    expect(screen.getByText("등록된 템플릿 상품을 관리합니다.")).toBeInTheDocument();
    expect(screen.getByText("썸네일")).toBeInTheDocument();
    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
  });

  it("상품이 없으면 빈 상태 메시지를 렌더링한다", () => {
    render(<AdminProductsTemplate page={buildPage({ items: [] })} />);

    expect(screen.getByText("등록된 상품이 없습니다.")).toBeInTheDocument();
  });

  it("상품 목록/휴지통 탭 링크를 렌더링한다", () => {
    render(<AdminProductsTemplate page={buildPage()} />);

    const trashLink = screen.getByRole("link", { name: "휴지통" });
    expect(trashLink).toHaveAttribute("href", "/admin/products?view=trash");
  });

  it("view가 trash면 휴지통 제목과 빈 상태 문구를 렌더링하고 상품 등록 버튼을 숨긴다", () => {
    render(
      <AdminProductsTemplate page={buildPage({ items: [] })} view="trash" />,
    );

    expect(screen.getByRole("heading", { name: "휴지통" })).toBeInTheDocument();
    expect(screen.getByText("삭제된 상품이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByText("상품 등록")).not.toBeInTheDocument();
  });

  it("nextCursor가 있으면 다음 페이지 버튼이 활성화된다", () => {
    render(<AdminProductsTemplate page={buildPage({ nextCursor: "abc" })} />);

    expect(screen.getByRole("link", { name: "다음 페이지" })).toBeInTheDocument();
  });
});
