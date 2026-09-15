import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { toastMessageMock } = vi.hoisted(() => ({ toastMessageMock: vi.fn() }));
vi.mock("sonner", () => ({ toast: { message: toastMessageMock } }));

import { AdminSettingsTemplate } from "./AdminSettingsTemplate";

describe("AdminSettingsTemplate", () => {
  beforeEach(() => {
    toastMessageMock.mockClear();
  });

  it("일반 탭의 입력 필드를 라벨과 연결해 렌더링한다", () => {
    render(<AdminSettingsTemplate />);

    expect(screen.getByLabelText("사이트명")).toHaveValue("tie-knot");
    expect(screen.getByLabelText("고객센터 이메일")).toHaveValue(
      "support@tie-knot.com",
    );
  });

  it("신규 가입 허용은 켜진 상태로, 유지보수 모드는 꺼진 상태로 시작한다", () => {
    render(<AdminSettingsTemplate />);

    const [allowSignup, maintenanceMode] = screen.getAllByRole("switch");
    expect(allowSignup).toHaveAttribute("aria-checked", "true");
    expect(maintenanceMode).toHaveAttribute("aria-checked", "false");
  });

  it("스위치를 클릭하면 상태가 전환된다", async () => {
    const user = userEvent.setup();
    render(<AdminSettingsTemplate />);

    const [, maintenanceMode] = screen.getAllByRole("switch");
    await user.click(maintenanceMode);

    expect(maintenanceMode).toHaveAttribute("aria-checked", "true");
  });

  it("저장하기를 누르면 준비 중 안내를 띄운다", async () => {
    const user = userEvent.setup();
    render(<AdminSettingsTemplate />);

    await user.click(screen.getByRole("button", { name: "저장하기" }));

    expect(toastMessageMock).toHaveBeenCalledWith(
      "설정 저장 기능은 준비 중입니다 — 실제로 저장되지 않습니다.",
    );
  });

  it("다른 탭으로 전환하면 준비 중 안내를 보여준다", async () => {
    const user = userEvent.setup();
    render(<AdminSettingsTemplate />);

    await user.click(screen.getByRole("tab", { name: "알림" }));

    expect(
      await screen.findByText("알림 설정은 준비 중입니다."),
    ).toBeInTheDocument();
  });
});
