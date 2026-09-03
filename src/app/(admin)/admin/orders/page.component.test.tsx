import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { encodeCursor } from "@/core/utils/cursor";

const validCursor = encodeCursor({
  createdAt: new Date("2026-08-01T00:00:00.000Z"),
  id: "68a3f0c1c2d3e4f5a6b7c8d9",
});

const { verifySessionMock, getAdminOrdersPageServiceMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
  getAdminOrdersPageServiceMock: vi.fn(),
}));

vi.mock("@/services/auth", () => ({
  verifySession: verifySessionMock,
}));
vi.mock("@/services/order", () => ({
  getAdminOrdersPageService: getAdminOrdersPageServiceMock,
}));

vi.mock("@/app/(admin)/admin/orders/_components/AdminOrdersTemplate", () => ({
  AdminOrdersTemplate: ({
    page,
    status,
    cursor,
  }: {
    page: { items: unknown[]; nextCursor: string | null };
    status?: string;
    cursor?: string;
  }) => (
    <div>
      템플릿:items={page.items.length}:status={status ?? "없음"}:cursor={cursor ?? "없음"}
    </div>
  ),
}));

import OrdersPage from "./page";

const emptyPage: { items: unknown[]; nextCursor: string | null } = {
  items: [],
  nextCursor: null,
};

describe("관리자 주문 목록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({ role: "ADMIN", email: "a@x.com", userId: "1" });
    getAdminOrdersPageServiceMock.mockResolvedValue(emptyPage);
  });

  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await OrdersPage({ searchParams: Promise.resolve({}) });

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });

  it("인증에 실패하면(verifySession이 throw) 목록 service를 호출하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(OrdersPage({ searchParams: Promise.resolve({}) })).rejects.toThrow();

    expect(getAdminOrdersPageServiceMock).not.toHaveBeenCalled();
  });

  it("인증 성공 후 URL의 status/cursor를 service에 그대로 전달한다", async () => {
    await OrdersPage({
      searchParams: Promise.resolve({ status: "CONFIRMED", cursor: validCursor }),
    });

    expect(getAdminOrdersPageServiceMock).toHaveBeenCalledWith({
      status: "CONFIRMED",
      cursor: validCursor,
    });
  });

  it("잘못된 status는 필터 없음으로 정규화된다", async () => {
    await OrdersPage({ searchParams: Promise.resolve({ status: "NOT_A_STATUS" }) });

    expect(getAdminOrdersPageServiceMock).toHaveBeenCalledWith({});
  });

  it("status가 배열이면(?status=A&status=B) 필터 없음으로 정규화된다", async () => {
    await OrdersPage({
      searchParams: Promise.resolve({ status: ["PENDING", "CONFIRMED"] }),
    });

    expect(getAdminOrdersPageServiceMock).toHaveBeenCalledWith({});
  });

  it("cursor가 없으면 첫 페이지로 취급한다", async () => {
    await OrdersPage({ searchParams: Promise.resolve({}) });

    expect(getAdminOrdersPageServiceMock).toHaveBeenCalledWith({});
  });

  it("형식이 깨진 cursor는 제거하고 나머지 필터는 유지한다", async () => {
    await OrdersPage({
      searchParams: Promise.resolve({ status: "CONFIRMED", cursor: "!!broken!!" }),
    });

    expect(getAdminOrdersPageServiceMock).toHaveBeenCalledWith({
      status: "CONFIRMED",
    });
  });

  it("service 결과와 현재 필터/cursor를 Template props로 전달한다", async () => {
    getAdminOrdersPageServiceMock.mockResolvedValue({
      items: [{ id: "1" }],
      nextCursor: "next",
    });

    render(
      await OrdersPage({
        searchParams: Promise.resolve({ status: "CONFIRMED", cursor: validCursor }),
      }),
    );

    expect(
      screen.getByText(`템플릿:items=1:status=CONFIRMED:cursor=${validCursor}`),
    ).toBeInTheDocument();
  });
});
