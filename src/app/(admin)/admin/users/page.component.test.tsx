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
  }: {
    page: { items: unknown[]; nextCursor: string | null };
    role?: string;
    cursor?: string;
  }) => (
    <div>
      템플릿:items={page.items.length}:role={role ?? "없음"}:cursor={cursor ?? "없음"}
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
    verifySessionMock.mockResolvedValue({ role: "ADMIN", email: "a@x.com", userId: "1" });
    getAdminUsersPageServiceMock.mockResolvedValue(emptyPage);
  });

  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await UsersPage({ searchParams: Promise.resolve({}) });

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });

  it("인증에 실패하면(verifySession이 throw) 목록 service를 호출하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(UsersPage({ searchParams: Promise.resolve({}) })).rejects.toThrow();

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
    await UsersPage({ searchParams: Promise.resolve({ role: ["USER", "ADMIN"] }) });

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

    expect(getAdminUsersPageServiceMock).toHaveBeenCalledWith({ role: "ADMIN" });
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
      screen.getByText(`템플릿:items=1:role=ADMIN:cursor=${validCursor}`),
    ).toBeInTheDocument();
  });
});
