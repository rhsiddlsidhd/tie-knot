import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { useOffsetListMock, deleteReviewByAdminMock } = vi.hoisted(() => ({
  useOffsetListMock: vi.fn(),
  deleteReviewByAdminMock: vi.fn(),
}));

vi.mock("@/ui/hooks/useOffsetList", () => ({
  useOffsetList: useOffsetListMock,
}));
vi.mock("@/actions/deleteReviewByAdmin", () => ({
  deleteReviewByAdmin: deleteReviewByAdminMock,
}));

import { AdminReviewsTable } from "./AdminReviewsTable";

const buildTable = (overrides: Record<string, unknown> = {}) => ({
  items: [
    {
      id: "review-1",
      productTitle: "봄빛 청첩장 세트",
      authorName: "김민준",
      rating: 4,
      content: "아주 만족합니다.",
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
  params: {},
  setPage: vi.fn(),
  setSearch: vi.fn(),
  toggleSort: vi.fn(),
  setParam: vi.fn(),
  ...overrides,
});

afterEach(() => vi.useRealTimers());

describe("AdminReviewsTable", () => {
  beforeEach(() => vi.clearAllMocks());

  it("관리자 리뷰 API를 조회하고 제목과 열을 렌더링한다", () => {
    useOffsetListMock.mockReturnValue(buildTable());
    render(<AdminReviewsTable />);

    expect(useOffsetListMock).toHaveBeenCalledWith({
      endpoint: "/api/admin/reviews",
    });
    expect(
      screen.getByRole("heading", { name: "리뷰 관리" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(["상품", "작성자", "평점", "내용", "작성일", "관리"]);
    expect(screen.getByText("김민준")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "내용 정렬" }),
    ).not.toBeInTheDocument();
  });

  it("정렬 가능한 열을 누르면 해당 sort 키로 정렬을 바꾼다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    render(<AdminReviewsTable />);

    await user.click(screen.getByRole("button", { name: "평점 정렬" }));
    await user.click(screen.getByRole("button", { name: "작성일 정렬" }));

    expect(table.toggleSort).toHaveBeenNthCalledWith(1, "rating");
    expect(table.toggleSort).toHaveBeenNthCalledWith(2, "createdAt");
  });

  it("페이지 버튼을 누르면 해당 페이지로 이동한다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    render(<AdminReviewsTable />);

    await user.click(screen.getByRole("button", { name: "2페이지" }));

    expect(table.setPage).toHaveBeenCalledWith(2);
  });

  it("검색어를 입력하면 debounce 뒤 검색을 반영한다", () => {
    vi.useFakeTimers();
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    render(<AdminReviewsTable />);

    fireEvent.change(screen.getByRole("searchbox", { name: "리뷰 검색" }), {
      target: { value: "김민준" },
    });
    act(() => vi.advanceTimersByTime(300));

    expect(table.setSearch).toHaveBeenCalledWith("김민준");
  });

  it("리뷰를 삭제하면 목록을 다시 조회한다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    deleteReviewByAdminMock.mockResolvedValue({
      success: true,
      data: { message: "리뷰가 삭제되었습니다." },
    });
    const user = userEvent.setup();
    render(<AdminReviewsTable />);

    await user.click(screen.getByRole("button", { name: "삭제" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "삭제",
      }),
    );

    expect(deleteReviewByAdminMock).toHaveBeenCalledWith("review-1");
    expect(table.mutate).toHaveBeenCalledOnce();
  });

  it("검색 결과가 없으면 검색 빈 문구를 보여준다", () => {
    useOffsetListMock.mockReturnValue(
      buildTable({ items: [], total: 0, totalPages: 0, q: "없는 리뷰" }),
    );
    render(<AdminReviewsTable />);

    expect(screen.getByText("검색 결과가 없습니다")).toBeInTheDocument();
  });
});
