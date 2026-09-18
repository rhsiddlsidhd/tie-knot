import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));

vi.mock("@/ui/hooks/useAuth", () => ({
  useAuth: useAuthMock,
}));
vi.mock("./AccountMenu", () => ({
  AccountMenu: () => <div>account-nav</div>,
}));

import { AuthStatus } from "./AuthStatus";

describe("AuthStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("로딩 중이면 스켈레톤을 렌더한다", () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: true });

    render(<AuthStatus />);

    expect(
      screen.queryByRole("link", { name: "로그인" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("account-nav")).not.toBeInTheDocument();
  });

  it("세션이 있으면 AccountMenu를 렌더한다", () => {
    useAuthMock.mockReturnValue({
      session: { role: "USER", email: "a@b.com", userId: "user-1" },
      isLoading: false,
    });

    render(<AuthStatus />);

    expect(screen.getByText("account-nav")).toBeInTheDocument();
  });

  it("세션이 없으면 로그인 링크를 렌더한다", () => {
    useAuthMock.mockReturnValue({ session: null, isLoading: false });

    render(<AuthStatus />);

    const link = screen.getByRole("link", { name: "로그인" });
    expect(link).toHaveAttribute("href", "/login");
  });
});
