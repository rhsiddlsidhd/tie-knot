import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { useOffsetListMock } = vi.hoisted(() => ({
  useOffsetListMock: vi.fn(),
}));

vi.mock("@/ui/hooks/useOffsetList", () => ({
  useOffsetList: useOffsetListMock,
}));

import { AdminOrdersTable } from "./AdminOrdersTable";

const buildTable = (overrides: Record<string, unknown> = {}) => ({
  items: [
    {
      id: "order-1",
      merchantUid: "ORD-20260901-0001",
      buyerName: "김민준",
      productTitle: "봄빛 청첩장",
      orderStatus: "CONFIRMED",
      finalPrice: 39000,
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ],
  total: 21,
  totalPages: 3,
  isLoading: false,
  isValidating: false,
  error: undefined as { message: string } | undefined,
  mutate: vi.fn(),
  page: 1,
  q: "",
  sort: undefined as string | undefined,
  direction: undefined as "asc" | "desc" | undefined,
  params: {} as { status?: string },
  setPage: vi.fn(),
  setSearch: vi.fn(),
  toggleSort: vi.fn(),
  setParam: vi.fn(),
  ...overrides,
});

afterEach(() => vi.useRealTimers());

describe("AdminOrdersTable", () => {
  beforeEach(() => vi.clearAllMocks());

  it("관리자 주문 API를 status 파라미터와 함께 조회하고 제목과 열을 렌더링한다", () => {
    useOffsetListMock.mockReturnValue(buildTable());
    render(<AdminOrdersTable />);

    expect(useOffsetListMock).toHaveBeenCalledWith({
      endpoint: "/api/admin/orders",
      params: ["status"],
    });
    expect(
      screen.getByRole("heading", { name: "주문 관리" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(["주문번호", "고객명", "상품", "상태", "금액", "주문일"]);
    expect(screen.getByText("ORD-20260901-0001")).toBeInTheDocument();
    expect(screen.getByText("39,000원")).toBeInTheDocument();
  });

  it("status가 없으면 전체 상태를 선택한다", () => {
    useOffsetListMock.mockReturnValue(buildTable());
    render(<AdminOrdersTable />);

    expect(screen.getByRole("radio", { name: "전체 상태" })).toBeChecked();
  });

  it("상태 필터를 고르면 status 파라미터를 바꾸고 전체로 돌리면 지운다", async () => {
    const table = buildTable({ params: { status: "PENDING" } });
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    render(<AdminOrdersTable />);

    expect(screen.getByRole("radio", { name: "주문대기" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "취소" }));
    await user.click(screen.getByRole("radio", { name: "전체 상태" }));

    expect(table.setParam).toHaveBeenNthCalledWith(1, "status", "CANCELLED");
    expect(table.setParam).toHaveBeenNthCalledWith(2, "status", undefined);
  });

  it("금액·주문일 열로 정렬을 바꾼다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    render(<AdminOrdersTable />);

    await user.click(screen.getByRole("button", { name: "금액 정렬" }));
    await user.click(screen.getByRole("button", { name: "주문일 정렬" }));

    expect(table.toggleSort).toHaveBeenNthCalledWith(1, "finalPrice");
    expect(table.toggleSort).toHaveBeenNthCalledWith(2, "createdAt");
  });

  it("페이지 버튼을 누르면 해당 페이지로 이동한다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    render(<AdminOrdersTable />);

    await user.click(screen.getByRole("button", { name: "3페이지" }));

    expect(table.setPage).toHaveBeenCalledWith(3);
  });

  it("검색어를 입력하면 debounce 뒤 검색을 반영한다", () => {
    vi.useFakeTimers();
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    render(<AdminOrdersTable />);

    fireEvent.change(screen.getByRole("searchbox", { name: "주문 검색" }), {
      target: { value: "김민준" },
    });
    act(() => vi.advanceTimersByTime(300));

    expect(table.setSearch).toHaveBeenCalledWith("김민준");
  });

  it("오류에서 다시 시도하면 목록을 다시 조회한다", async () => {
    const table = buildTable({
      items: undefined,
      error: { message: "주문 목록을 불러오지 못했습니다." },
    });
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    render(<AdminOrdersTable />);

    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(table.mutate).toHaveBeenCalledOnce();
  });
});
