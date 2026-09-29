import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { verifySessionMock, getAdminUsersPageServiceMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
  getAdminUsersPageServiceMock: vi.fn(),
}));

vi.mock("@/services/auth", () => ({ verifySession: verifySessionMock }));
vi.mock("@/services/user", () => ({
  getAdminUsersPageService: getAdminUsersPageServiceMock,
}));
vi.mock("@/app/(admin)/admin/users/_components/AdminUsersTemplate", () => ({
  AdminUsersTemplate: ({
    page,
    role,
    q,
  }: {
    page: { items: unknown[] };
    role?: string;
    q?: string;
  }) => (
    <div>
      템플릿:items={page.items.length}:role={role ?? "없음"}:q={q ?? "없음"}
    </div>
  ),
}));

import UsersPage from "./page";

const emptyPage = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

describe("관리자 사용자 목록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({
      role: "ADMIN",
      email: "a@x.com",
      userId: "1",
    });
    getAdminUsersPageServiceMock.mockResolvedValue(emptyPage);
  });

  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await UsersPage({ searchParams: Promise.resolve({}) });
    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });

  it("offset·정렬·필터를 서비스에 전달한다", async () => {
    await UsersPage({
      searchParams: Promise.resolve({
        page: "2",
        limit: "20",
        q: "김",
        role: "ADMIN",
        sort: "name",
        direction: "asc",
      }),
    });
    expect(getAdminUsersPageServiceMock).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      q: "김",
      role: "ADMIN",
      sort: "name",
      direction: "asc",
    });
  });

  it("잘못된 입력은 기본 목록 요청으로 정규화한다", async () => {
    await UsersPage({ searchParams: Promise.resolve({ role: "OWNER" }) });
    expect(getAdminUsersPageServiceMock).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      q: undefined,
      role: undefined,
      sort: undefined,
      direction: "desc",
    });
  });

  it("서비스 결과와 필터를 템플릿에 전달한다", async () => {
    getAdminUsersPageServiceMock.mockResolvedValue({
      ...emptyPage,
      items: [{ id: "1" }],
      total: 1,
      totalPages: 1,
    });
    render(
      await UsersPage({
        searchParams: Promise.resolve({ q: "김", role: "ADMIN" }),
      }),
    );
    expect(
      screen.getByText("템플릿:items=1:role=ADMIN:q=김"),
    ).toBeInTheDocument();
  });
});
