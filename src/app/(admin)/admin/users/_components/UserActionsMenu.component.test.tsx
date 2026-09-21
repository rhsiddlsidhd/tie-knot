import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { toastMessageMock } = vi.hoisted(() => ({ toastMessageMock: vi.fn() }));
vi.mock("sonner", () => ({ toast: { message: toastMessageMock } }));

import { UserActionsMenu } from "./UserActionsMenu";

describe("UserActionsMenu", () => {
  beforeEach(() => {
    toastMessageMock.mockClear();
  });

  it("상세보기를 클릭하면 준비 중 안내를 띄운다", async () => {
    const user = userEvent.setup();
    render(<UserActionsMenu />);

    await user.click(screen.getByRole("button", { name: "사용자 메뉴" }));
    await user.click(await screen.findByText("상세보기"));

    expect(toastMessageMock).toHaveBeenCalledWith(
      "사용자 관리 기능은 준비 중입니다.",
    );
  });

  it("권한 변경을 클릭하면 준비 중 안내를 띄운다", async () => {
    const user = userEvent.setup();
    render(<UserActionsMenu />);

    await user.click(screen.getByRole("button", { name: "사용자 메뉴" }));
    await user.click(await screen.findByText("권한 변경"));

    expect(toastMessageMock).toHaveBeenCalledWith(
      "사용자 관리 기능은 준비 중입니다.",
    );
  });
});
