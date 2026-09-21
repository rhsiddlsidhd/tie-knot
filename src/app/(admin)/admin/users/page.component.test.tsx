import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { encodeCursor } from "@/core/utils/cursor";

const validCursor = encodeCursor({
  createdAt: new Date("2026-08-01T00:00:00.000Z"),
  id: "68a3f0c1c2d3e4f5a6b7c8d9",
});

const { verifySessionMock, getAdminUsersPageServiceMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
  getAdminUsersPageServiceMock: vi.fn(),
}));

vi.mock("@/services/auth", () => ({
  verifySession: verifySessionMock,
}));
vi.mock("@/services/user", () => ({
  getAdminUsersPageService: getAdminUsersPageServiceMock,
}));

vi.mock("@/app/(admin)/admin/users/_components/AdminUsersTemplate", () => ({
  AdminUsersTemplate: ({
    page,
    role,
    cursor,
    q,
  }: {
    page: { items: unknown[]; nextCursor: string | null };
    role?: string;
    cursor?: string;
    q?: string;
  }) => (
    <div>
      템플릿:items={page.items.length}:role={role ?? "없음"}:cursor=
      {cursor ?? "없음"}:q={q ?? "없음"}
    </div>
  ),
}));

import UsersPage from "./page";

const emptyPage: { items: unknown[]; nextCursor: string | null } = {
  items: [],
  nextCursor: null,
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

  it("인증에 실패하면(verifySession이 throw) 목록 service를 호출하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(
      UsersPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow();

    expect(getAdminUsersPageServiceMock).not.toHaveBeenCalled();
  });

  it("인증 성공 후 URL의 role/cursor를 service에 그대로 전달한다", async () => {
    await UsersPage({
      searchParams: Promise.resolve({ role: "ADMIN", cursor: validCursor }),
    });

    expect(getAdminUsersPageServiceMock).toHaveBeenCalledWith({
      role: "ADMIN",
      cursor: validCursor,
    });
  });

  it("잘못된 role은 필터 없음으로 정규화된다", async () => {
    await UsersPage({ searchParams: Promise.resolve({ role: "SUPERADMIN" }) });

    expect(getAdminUsersPageServiceMock).toHaveBeenCalledWith({});
  });

  it("role이 배열이면(?role=A&role=B) 필터 없음으로 정규화된다", async () => {
    await UsersPage({
      searchParams: Promise.resolve({ role: ["USER", "ADMIN"] }),
    });

    expect(getAdminUsersPageServiceMock).toHaveBeenCalledWith({});
  });

  it("cursor가 없으면 첫 페이지로 취급한다", async () => {
    await UsersPage({ searchParams: Promise.resolve({}) });

    expect(getAdminUsersPageServiceMock).toHaveBeenCalledWith({});
  });

  it("형식이 깨진 cursor는 제거하고 나머지 필터는 유지한다", async () => {
    await UsersPage({
      searchParams: Promise.resolve({ role: "ADMIN", cursor: "!!broken!!" }),
    });

    expect(getAdminUsersPageServiceMock).toHaveBeenCalledWith({
      role: "ADMIN",
    });
  });

  it("service 결과와 현재 필터/cursor를 Template props로 전달한다", async () => {
    getAdminUsersPageServiceMock.mockResolvedValue({
      items: [{ id: "1" }],
      nextCursor: "next",
    });

    render(
      await UsersPage({
        searchParams: Promise.resolve({ role: "ADMIN", cursor: validCursor }),
      }),
    );

    expect(
      screen.getByText(
        `템플릿:items=1:role=ADMIN:cursor=${validCursor}:q=없음`,
      ),
    ).toBeInTheDocument();
  });

  it("검색어를 서비스에 넘기고 Template에 전달한다", async () => {
    render(
      await UsersPage({
        searchParams: Promise.resolve({ q: "김철수" }),
      }),
    );

    expect(getAdminUsersPageServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ q: "김철수" }),
    );
    expect(screen.getByText(/q=김철수/)).toBeInTheDocument();
  });

  it("빈 검색어는 조건 없음으로 정규화한다", async () => {
    await UsersPage({ searchParams: Promise.resolve({ q: "   " }) });

    expect(getAdminUsersPageServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ q: undefined }),
    );
  });

  it("검색어와 역할 필터를 함께 넘긴다", async () => {
    await UsersPage({
      searchParams: Promise.resolve({ q: "김철수", role: "ADMIN" }),
    });

    expect(getAdminUsersPageServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ q: "김철수", role: "ADMIN" }),
    );
  });

  // 검색어가 100자를 넘으면 스키마가 통째로 거부한다 — 필터/커서 없음으로 떨어뜨려
  // 페이지가 throw하지 않게 한다(URL이 소유하는 값이라 어떤 입력도 올 수 있다).
  it("지나치게 긴 검색어는 조건 없이 조회한다", async () => {
    await UsersPage({
      searchParams: Promise.resolve({ q: "가".repeat(101) }),
    });

    expect(getAdminUsersPageServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({ q: undefined }),
    );
  });
});
