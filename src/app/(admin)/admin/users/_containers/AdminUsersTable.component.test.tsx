import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { useOffsetListMock } = vi.hoisted(() => ({
  useOffsetListMock: vi.fn(),
}));

vi.mock("@/ui/hooks/useOffsetList", () => ({
  useOffsetList: useOffsetListMock,
}));

import { ADMIN_USER_SORT_KEYS, USER_ROLES } from "@/core/domain/user";
import { AdminUsersTable } from "./AdminUsersTable";

const buildTable = (overrides: Record<string, unknown> = {}) => ({
  items: [
    {
      id: "user-1",
      name: "김민준",
      email: "minjun@example.com",
      createdAt: "2026-09-01T00:00:00.000Z",
      role: "USER",
      deletedAt: null as string | null,
    },
  ],
  pageInfo: { total: 21, totalPages: 3 },
  isLoading: false,
  isValidating: false,
  error: undefined as { message: string } | undefined,
  mutate: vi.fn(),
  page: 1,
  q: "",
  sortState: null as { key: string; direction: "asc" | "desc" } | null,
  params: { role: null } as { role: string | null },
  setPage: vi.fn(),
  setSearch: vi.fn(),
  toggleSort: vi.fn(),
  setParam: vi.fn(),
  ...overrides,
});

afterEach(() => vi.useRealTimers());

describe("AdminUsersTable", () => {
  beforeEach(() => vi.clearAllMocks());

  it("관리자 사용자 API를 role 파라미터와 함께 조회하고 제목과 열을 렌더링한다", () => {
    useOffsetListMock.mockReturnValue(buildTable());
    render(<AdminUsersTable />);

    expect(useOffsetListMock).toHaveBeenCalledWith({
      endpoint: "/api/admin/users",
      sortKeys: ADMIN_USER_SORT_KEYS,
      params: { role: USER_ROLES },
    });
    expect(
      screen.getByRole("heading", { name: "사용자 관리" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(["이름", "이메일", "가입일", "역할", "상태", "관리"]);
    expect(screen.getByText("minjun@example.com")).toBeInTheDocument();
    expect(screen.getByText("활동중")).toBeInTheDocument();
  });

  it("역할 필터를 고르면 role 파라미터를 바꾸고 전체로 돌리면 지운다", async () => {
    const table = buildTable({ params: { role: "USER" } });
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    render(<AdminUsersTable />);

    expect(screen.getByRole("radio", { name: "일반회원" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "관리자" }));
    await user.click(screen.getByRole("radio", { name: "전체 역할" }));

    expect(table.setParam).toHaveBeenNthCalledWith(1, "role", "ADMIN");
    expect(table.setParam).toHaveBeenNthCalledWith(2, "role", null);
  });

  it("이름·가입일 열로 정렬을 바꾼다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    render(<AdminUsersTable />);

    await user.click(screen.getByRole("button", { name: "이름 정렬" }));
    await user.click(screen.getByRole("button", { name: "가입일 정렬" }));

    expect(table.toggleSort).toHaveBeenNthCalledWith(1, "name");
    expect(table.toggleSort).toHaveBeenNthCalledWith(2, "createdAt");
  });

  it("페이지 버튼을 누르면 해당 페이지로 이동한다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    render(<AdminUsersTable />);

    await user.click(screen.getByRole("button", { name: "다음 페이지" }));

    expect(table.setPage).toHaveBeenCalledWith(2);
  });

  it("검색어를 입력하면 debounce 뒤 검색을 반영한다", () => {
    vi.useFakeTimers();
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    render(<AdminUsersTable />);

    fireEvent.change(screen.getByRole("searchbox", { name: "사용자 검색" }), {
      target: { value: "minjun" },
    });
    act(() => vi.advanceTimersByTime(300));

    expect(table.setSearch).toHaveBeenCalledWith("minjun");
  });
});
