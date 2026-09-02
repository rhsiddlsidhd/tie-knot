import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AdminUserListPage } from "@/core/domain/user";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/admin/users",
}));

const { toastMessageMock } = vi.hoisted(() => ({ toastMessageMock: vi.fn() }));
vi.mock("sonner", () => ({ toast: { message: toastMessageMock } }));

import { AdminUsersTemplate } from "./AdminUsersTemplate";

const buildPage = (overrides?: Partial<AdminUserListPage>): AdminUserListPage => ({
  items: [
    {
      id: "user-1",
      name: "김민준",
      email: "minjun.kim@email.com",
      createdAt: new Date("2026-08-19T15:30:00.000Z"), // KST 2026-08-20
      role: "USER",
      deletedAt: null,
    },
  ],
  nextCursor: null,
  ...overrides,
});

describe("AdminUsersTemplate", () => {
  beforeEach(() => {
    pushMock.mockClear();
    toastMessageMock.mockClear();
  });

  it("사용자 행을 실제 props 기준으로 렌더링하고 가입일을 KST로 표시한다", () => {
    render(<AdminUsersTemplate page={buildPage()} />);

    expect(screen.getByText("김민준")).toBeInTheDocument();
    expect(screen.getByText("minjun.kim@email.com")).toBeInTheDocument();
    expect(screen.getByText("2026.8.20")).toBeInTheDocument();
    expect(screen.getByText("일반회원")).toBeInTheDocument();
  });

  it("활동중/탈퇴 Badge를 상태에 맞게 렌더링한다", () => {
    render(
      <AdminUsersTemplate
        page={buildPage({
          items: [
            { id: "u1", name: "A", email: "a@x.com", createdAt: new Date(), role: "USER", deletedAt: null },
            { id: "u2", name: "B", email: "b@x.com", createdAt: new Date(), role: "USER", deletedAt: new Date() },
          ],
        })}
      />,
    );

    expect(screen.getByText("활동중")).toBeInTheDocument();
    expect(screen.getByText("탈퇴")).toBeInTheDocument();
  });

  it("항목이 없으면 빈 상태 UI를 보여준다", () => {
    render(<AdminUsersTemplate page={buildPage({ items: [] })} />);

    expect(screen.getByText("해당 역할의 사용자가 없습니다")).toBeInTheDocument();
  });

  it("역할 필터를 변경하면 해당 role query로 이동한다", async () => {
    const user = userEvent.setup();
    render(<AdminUsersTemplate page={buildPage()} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "관리자" }));

    expect(pushMock).toHaveBeenCalledWith("/admin/users?role=ADMIN");
  });

  it("전체 역할을 선택하면 role query가 제거된다", async () => {
    const user = userEvent.setup();
    render(<AdminUsersTemplate page={buildPage()} role="ADMIN" />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "전체 역할" }));

    expect(pushMock).toHaveBeenCalledWith("/admin/users");
  });

  it("현재 role 필터를 Pagination 링크에 그대로 전달한다(cursor는 제거)", () => {
    render(
      <AdminUsersTemplate
        page={buildPage({ nextCursor: "next-cursor" })}
        role="ADMIN"
        cursor="current-cursor"
      />,
    );

    const nextLink = screen.getByRole("link", { name: "다음 페이지" });
    expect(nextLink).toHaveAttribute(
      "href",
      "/admin/users?role=ADMIN&cursor=next-cursor",
    );
    const firstLink = screen.getByRole("link", { name: "첫 페이지" });
    expect(firstLink).toHaveAttribute("href", "/admin/users?role=ADMIN");
  });

  it("사용자 메뉴는 상세보기/권한 변경 모두 준비 중 안내를 띄운다", async () => {
    const user = userEvent.setup();
    render(<AdminUsersTemplate page={buildPage()} />);

    await user.click(screen.getByRole("button", { name: "사용자 메뉴" }));
    await user.click(await screen.findByText("상세보기"));

    expect(toastMessageMock).toHaveBeenCalledWith("사용자 관리 기능은 준비 중입니다.");
  });
});
