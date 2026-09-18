import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AdminProductListPage, ProductJson } from "@/core/domain/product";

vi.mock("./ProductTableRow", () => ({
  ProductTableRow: ({ product }: { product: { title: string } }) => (
    <tr>
      <td>{product.title}</td>
    </tr>
  ),
}));

import { AdminProductsTemplate } from "./AdminProductsTemplate";

const buildProduct = (overrides?: Partial<ProductJson>): ProductJson =>
  ({
    _id: "product-1",
    title: "봄맞이 청첩장",
    ...overrides,
  }) as ProductJson;

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

    expect(
      screen.getByText("등록된 템플릿 상품을 관리합니다."),
    ).toBeInTheDocument();
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

  // view 전환은 QueryFilterSelect가 아니라 Link 버튼이라 q를 자동으로 실어주지
  // 않는다 — 검색 후 휴지통을 누르면 검색어가 사라지는 회귀를 막는 계약이다.
  it("검색어가 있으면 상품 목록/휴지통 탭 링크에 q를 함께 실어 보낸다", () => {
    render(<AdminProductsTemplate page={buildPage()} q="청첩장" />);

    const activeLink = screen.getByRole("link", { name: "상품 목록" });
    expect(activeLink).toHaveAttribute(
      "href",
      `/admin/products?q=${encodeURIComponent("청첩장")}`,
    );

    const trashLink = screen.getByRole("link", { name: "휴지통" });
    expect(trashLink).toHaveAttribute(
      "href",
      `/admin/products?view=trash&q=${encodeURIComponent("청첩장")}`,
    );
  });

  it("QuerySearchInput에 현재 검색어와 view를 전달한다", () => {
    render(
      <AdminProductsTemplate page={buildPage()} q="청첩장" view="trash" />,
    );

    expect(screen.getByRole("searchbox")).toHaveValue("청첩장");
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

    expect(
      screen.getByRole("link", { name: "다음 페이지" }),
    ).toBeInTheDocument();
  });
});
