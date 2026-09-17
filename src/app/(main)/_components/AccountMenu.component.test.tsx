import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { logoutMock, useAuthMock } = vi.hoisted(() => ({
  logoutMock: vi.fn(),
  useAuthMock: vi.fn(),
}));

vi.mock("@/ui/hooks/useAuth", () => ({
  useAuth: useAuthMock,
}));
vi.mock("../_hooks/useLogout", () => ({
  useLogout: () => ({ logout: logoutMock }),
}));

import { AccountMenu } from "./AccountMenu";

describe("AccountMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      session: { role: "USER", email: "a@b.com", userId: "user-1" },
      isLoading: false,
    });
  });

  it("사용자 메뉴 버튼에 접근 가능한 이름을 제공한다", () => {
    render(<AccountMenu />);

    expect(
      screen.getByRole("button", { name: "사용자 메뉴" }),
    ).toBeInTheDocument();
  });

  it("로그아웃 클릭 시 useLogout의 logout을 호출한다", async () => {
    const user = userEvent.setup();
    render(<AccountMenu />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("로그아웃"));

    expect(logoutMock).toHaveBeenCalledOnce();
  });
});
