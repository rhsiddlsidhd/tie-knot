import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { verifySessionMock, adminProductsTableMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
  adminProductsTableMock: vi.fn(),
}));
vi.mock("@/services/auth", () => ({ verifySession: verifySessionMock }));
vi.mock("@/app/(admin)/admin/products/_containers/AdminProductsTable", () => ({
  AdminProductsTable: (props: { isDelete: boolean }) => {
    adminProductsTableMock(props);
    return <div>상품 테이블</div>;
  },
}));

import ProductsPage from "./page";

const renderPage = async (
  searchParams: Record<string, string | undefined> = {},
) => render(await ProductsPage({ searchParams: Promise.resolve(searchParams) }));

describe("관리자 상품 목록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({
      role: "ADMIN",
      email: "a@x.com",
      userId: "1",
    });
  });

  it("ADMIN 권한을 확인한 뒤 상품 테이블을 렌더링한다", async () => {
    await renderPage();

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
    expect(screen.getByText("상품 테이블")).toBeInTheDocument();
  });

  it("인증에 실패하면(verifySession이 throw) 테이블을 렌더링하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(ProductsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "redirect",
    );
  });

  it("softDeleted가 없으면 상품 목록 제목·등록 버튼·휴지통 이동 링크를 보여준다", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", { name: "상품 목록" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("등록된 템플릿 상품을 관리합니다."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "상품 등록" })).toHaveAttribute(
      "href",
      "/admin/products/new",
    );
    expect(screen.getByRole("link", { name: "휴지통" })).toHaveAttribute(
      "href",
      "/admin/products?softDeleted=true",
    );
    expect(adminProductsTableMock).toHaveBeenCalledWith({ isDelete: false });
  });

  it("softDeleted=true면 휴지통 제목·상품 목록 이동 링크를 보여주고 등록 버튼을 숨긴다", async () => {
    await renderPage({ softDeleted: "true" });

    expect(screen.getByRole("heading", { name: "휴지통" })).toBeInTheDocument();
    expect(
      screen.getByText("삭제된 상품을 조회하고 복구합니다."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "상품 등록" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "상품 목록" })).toHaveAttribute(
      "href",
      "/admin/products",
    );
    expect(adminProductsTableMock).toHaveBeenCalledWith({ isDelete: true });
  });
});
