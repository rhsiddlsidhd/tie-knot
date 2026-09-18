import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SwitchField } from "./SwitchField";

describe("SwitchField", () => {
  it("label과 message를 표시한다", () => {
    render(
      <SwitchField
        id="marketing"
        name="marketing"
        label="마케팅 수신 동의"
        description="언제든 해제할 수 있습니다."
      />,
    );

    expect(screen.getByText("마케팅 수신 동의")).toBeInTheDocument();
    expect(screen.getByText("언제든 해제할 수 있습니다.")).toBeInTheDocument();
  });

  it("defaultValue를 지정하지 않으면 꺼진 상태로 시작한다", () => {
    render(
      <SwitchField id="marketing" name="marketing" label="마케팅 수신 동의" />,
    );

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("클릭하면 켜진 상태로 전환된다", async () => {
    const user = userEvent.setup();
    render(
      <SwitchField id="marketing" name="marketing" label="마케팅 수신 동의" />,
    );

    await user.click(screen.getByRole("switch"));

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("checked와 onCheckedChange로 외부 상태를 제어한다", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    render(
      <SwitchField
        id="premium"
        label="프리미엄 상품"
        checked
        onCheckedChange={onCheckedChange}
      />,
    );

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });
});
