import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { verifySessionMock, getAdminOrdersPageServiceMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
  getAdminOrdersPageServiceMock: vi.fn(),
}));

vi.mock("@/services/auth", () => ({ verifySession: verifySessionMock }));
vi.mock("@/services/order", () => ({
  getAdminOrdersPageService: getAdminOrdersPageServiceMock,
}));
vi.mock("@/app/(admin)/admin/orders/_components/AdminOrdersTemplate", () => ({
  AdminOrdersTemplate: ({
    page,
    status,
    q,
  }: {
    page: { items: unknown[] };
    status?: string;
    q?: string;
  }) => (
    <div>
      템플릿:items={page.items.length}:status={status ?? "없음"}:q=
      {q ?? "없음"}
    </div>
  ),
}));

import OrdersPage from "./page";

const emptyPage = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

describe("관리자 주문 목록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({
      role: "ADMIN",
      email: "a@x.com",
      userId: "1",
    });
    getAdminOrdersPageServiceMock.mockResolvedValue(emptyPage);
  });

  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await OrdersPage({ searchParams: Promise.resolve({}) });
    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });

  it("인증 실패 시 목록 서비스를 호출하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));
    await expect(
      OrdersPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow();
    expect(getAdminOrdersPageServiceMock).not.toHaveBeenCalled();
  });

  it("offset·정렬·필터를 서비스에 전달한다", async () => {
    await OrdersPage({
      searchParams: Promise.resolve({
        page: "2",
        limit: "25",
        q: "김철수",
        status: "CONFIRMED",
        sort: "finalPrice",
        direction: "asc",
      }),
    });

    expect(getAdminOrdersPageServiceMock).toHaveBeenCalledWith({
      page: 2,
      limit: 25,
      q: "김철수",
      status: "CONFIRMED",
      sort: "finalPrice",
      direction: "asc",
    });
  });

  it("잘못된 입력은 기본 목록 요청으로 정규화한다", async () => {
    await OrdersPage({ searchParams: Promise.resolve({ page: "0" }) });
    expect(getAdminOrdersPageServiceMock).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      q: undefined,
      status: undefined,
      sort: undefined,
      direction: "desc",
    });
  });

  it("서비스 결과와 필터를 템플릿에 전달한다", async () => {
    getAdminOrdersPageServiceMock.mockResolvedValue({
      ...emptyPage,
      items: [{ id: "1" }],
      total: 1,
      totalPages: 1,
    });
    render(
      await OrdersPage({
        searchParams: Promise.resolve({ q: "김철수", status: "CONFIRMED" }),
      }),
    );
    expect(
      screen.getByText("템플릿:items=1:status=CONFIRMED:q=김철수"),
    ).toBeInTheDocument();
  });
});
