import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { encodeCursor } from "@/core/utils/cursor";

const validCursor = encodeCursor({
  createdAt: new Date("2026-08-01T00:00:00.000Z"),
  id: "68a3f0c1c2d3e4f5a6b7c8d9",
});

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
      cursor,
    }: {
      page: { items: unknown[]; nextCursor: string | null };
      view?: string;
      q?: string;
      cursor?: string;
    }) => (
      <div>
        템플릿:items={page.items.length}:view={view ?? "없음"}:q=
        {q ?? "없음"}:cursor={cursor ?? "없음"}
      </div>
    ),
  }),
);

import ProductsPage from "./page";

const emptyPage: { items: unknown[]; nextCursor: string | null } = {
  items: [],
  nextCursor: null,
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
      cursor: undefined,
    });
  });

  it("인증 성공 후 URL의 view/cursor를 service에 그대로 전달한다", async () => {
    await ProductsPage({
      searchParams: Promise.resolve({ view: "trash", cursor: validCursor }),
    });

    expect(getAdminProductsPageServiceMock).toHaveBeenCalledWith({
      view: "trash",
      cursor: validCursor,
    });
  });

  it("잘못된 view는 기본값 'active'로 정규화되고 cursor도 함께 버려진다", async () => {
    await ProductsPage({
      searchParams: Promise.resolve({
        view: "NOT_A_VIEW",
        cursor: validCursor,
      }),
    });

    expect(getAdminProductsPageServiceMock).toHaveBeenCalledWith({
      view: "active",
      cursor: undefined,
    });
  });

  it("view가 배열이면(?view=A&view=B) 기본값 'active'로 정규화된다", async () => {
    await ProductsPage({
      searchParams: Promise.resolve({ view: ["active", "trash"] }),
    });

    expect(getAdminProductsPageServiceMock).toHaveBeenCalledWith({
      view: "active",
      cursor: undefined,
    });
  });

  it("형식이 깨진 cursor는 제거하고 view는 유지한다", async () => {
    await ProductsPage({
      searchParams: Promise.resolve({ view: "trash", cursor: "!!broken!!" }),
    });

    expect(getAdminProductsPageServiceMock).toHaveBeenCalledWith({
      view: "trash",
      cursor: undefined,
    });
  });

  it("service 결과와 현재 필터/cursor를 Template props로 전달한다", async () => {
    getAdminProductsPageServiceMock.mockResolvedValue({
      items: [{ id: "1" }],
      nextCursor: "next",
    });

    render(
      await ProductsPage({
        searchParams: Promise.resolve({ view: "trash", cursor: validCursor }),
      }),
    );

    expect(
      screen.getByText(
        `템플릿:items=1:view=trash:q=없음:cursor=${validCursor}`,
      ),
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

  // 검색어가 100자를 넘으면 스키마가 통째로 거부한다 — 필터/커서 없음으로 떨어뜨려
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
