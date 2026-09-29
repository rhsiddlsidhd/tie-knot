import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { verifySessionMock, getAdminProductsPageServiceMock } = vi.hoisted(
  () => ({
    verifySessionMock: vi.fn(),
    getAdminProductsPageServiceMock: vi.fn(),
  }),
);

vi.mock("@/services/auth", () => ({
  verifySession: verifySessionMock,
}));
vi.mock("@/services/product", () => ({
  getAdminProductsPageService: getAdminProductsPageServiceMock,
}));

vi.mock(
  "@/app/(admin)/admin/products/_components/AdminProductsTemplate",
  () => ({
    AdminProductsTemplate: ({
      page,
      view,
      q,
    }: {
      page: { items: unknown[] };
      view?: string;
      q?: string;
    }) => (
      <div>
        템플릿:items={page.items.length}:view={view ?? "없음"}:q={q ?? "없음"}
      </div>
    ),
  }),
);

import ProductsPage from "./page";

const emptyPage = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

describe("관리자 상품 목록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({
      role: "ADMIN",
      email: "a@x.com",
      userId: "1",
    });
    getAdminProductsPageServiceMock.mockResolvedValue(emptyPage);
  });

  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await ProductsPage({ searchParams: Promise.resolve({}) });

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });

  it("인증에 실패하면(verifySession이 throw) 목록 service를 호출하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(
      ProductsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow();

    expect(getAdminProductsPageServiceMock).not.toHaveBeenCalled();
  });

  it("view가 없으면 기본값 'active'로 service를 호출한다", async () => {
    await ProductsPage({ searchParams: Promise.resolve({}) });

    expect(getAdminProductsPageServiceMock).toHaveBeenCalledWith({
      view: "active",
      page: 1,
      limit: 10,
      q: undefined,
      sort: undefined,
      direction: "desc",
    });
  });

  it("인증 성공 후 URL의 offset·정렬·view를 service에 전달한다", async () => {
    await ProductsPage({
      searchParams: Promise.resolve({
        view: "trash",
        page: "2",
        limit: "25",
        sort: "price",
        direction: "asc",
      }),
    });

    expect(getAdminProductsPageServiceMock).toHaveBeenCalledWith({
      view: "trash",
      page: 2,
      limit: 25,
      q: undefined,
      sort: "price",
      direction: "asc",
    });
  });

  it("잘못된 view는 전체 요청을 기본값으로 정규화한다", async () => {
    await ProductsPage({
      searchParams: Promise.resolve({
        view: "NOT_A_VIEW",
        page: "2",
      }),
    });

    expect(getAdminProductsPageServiceMock).toHaveBeenCalledWith({
      view: "active",
      page: 1,
      limit: 10,
      q: undefined,
      sort: undefined,
      direction: "desc",
    });
  });

  it("view가 배열이면(?view=A&view=B) 기본값 'active'로 정규화된다", async () => {
    await ProductsPage({
      searchParams: Promise.resolve({ view: ["active", "trash"] }),
    });

    expect(getAdminProductsPageServiceMock).toHaveBeenCalledWith({
      view: "active",
      page: 1,
      limit: 10,
      q: undefined,
      sort: undefined,
      direction: "desc",
    });
  });

  it("범위를 벗어난 page는 기본값으로 정규화한다", async () => {
    await ProductsPage({
      searchParams: Promise.resolve({ view: "trash", page: "0" }),
    });

    expect(getAdminProductsPageServiceMock).toHaveBeenCalledWith({
      view: "active",
      page: 1,
      limit: 10,
      q: undefined,
      sort: undefined,
      direction: "desc",
    });
  });

  it("service 결과와 현재 필터를 Template props로 전달한다", async () => {
    getAdminProductsPageServiceMock.mockResolvedValue({
      items: [{ id: "1" }],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    render(
      await ProductsPage({
        searchParams: Promise.resolve({ view: "trash" }),
      }),
    );

    expect(
      screen.getByText("템플릿:items=1:view=trash:q=없음"),
    ).toBeInTheDocument();
  });

  it("검색어를 서비스에 넘기고 Template에 전달한다", async () => {
    render(
      await ProductsPage({
        searchParams: Promise.resolve({ q: "청첩장" }),
      }),
    );

    expect(getAdminProductsPageServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ q: "청첩장" }),
    );
    expect(screen.getByText(/q=청첩장/)).toBeInTheDocument();
  });

  it("빈 검색어는 조건 없음으로 정규화한다", async () => {
    await ProductsPage({ searchParams: Promise.resolve({ q: "   " }) });

    expect(getAdminProductsPageServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ q: undefined }),
    );
  });

  it("검색어와 view 필터를 함께 넘긴다", async () => {
    await ProductsPage({
      searchParams: Promise.resolve({ q: "청첩장", view: "trash" }),
    });

    expect(getAdminProductsPageServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ q: "청첩장", view: "trash" }),
    );
  });

  // 검색어가 100자를 넘으면 스키마가 통째로 거부한다 — 기본 필터로 떨어뜨려
  // 페이지가 throw하지 않게 한다(URL이 소유하는 값이라 어떤 입력도 올 수 있다).
  it("지나치게 긴 검색어는 조건 없이 조회한다", async () => {
    await ProductsPage({
      searchParams: Promise.resolve({ q: "가".repeat(101) }),
    });

    expect(getAdminProductsPageServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ q: undefined }),
    );
  });
});
