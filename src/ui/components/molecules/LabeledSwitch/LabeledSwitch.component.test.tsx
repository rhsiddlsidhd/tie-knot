import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LabeledSwitch } from "@/ui/components/molecules/LabeledSwitch";

describe("LabeledSwitch", () => {
  it("라벨을 접근 가능한 이름으로 갖는 스위치를 렌더링한다", () => {
    render(
      <LabeledSwitch
        id="trash"
        label="휴지통"
        checked={false}
        onCheckedChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("switch", { name: "휴지통" })).toBeInTheDocument();
  });

  it("checked 값을 그대로 반영한다", () => {
    const { rerender } = render(
      <LabeledSwitch
        id="trash"
        label="휴지통"
        checked={false}
        onCheckedChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("switch", { name: "휴지통" })).not.toBeChecked();

    rerender(
      <LabeledSwitch
        id="trash"
        label="휴지통"
        checked
        onCheckedChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("switch", { name: "휴지통" })).toBeChecked();
  });

  it("스위치를 누르면 반전된 값으로 onCheckedChange를 호출한다", async () => {
    const onCheckedChange = vi.fn();
    render(
      <LabeledSwitch
        id="trash"
        label="휴지통"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );

    await userEvent.click(screen.getByRole("switch", { name: "휴지통" }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("라벨을 눌러도 스위치가 전환된다", async () => {
    const onCheckedChange = vi.fn();
    render(
      <LabeledSwitch
        id="trash"
        label="휴지통"
        checked
        onCheckedChange={onCheckedChange}
      />,
    );

    await userEvent.click(screen.getByText("휴지통"));

    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });
});
