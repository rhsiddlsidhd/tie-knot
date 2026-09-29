import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterToggleGroup } from "./FilterToggleGroup";

const options = [
  { value: "ALL", label: "전체" },
  { value: "USER", label: "일반회원" },
  { value: "ADMIN", label: "관리자" },
] as const;

describe("FilterToggleGroup", () => {
  it("label을 그룹의 접근 가능한 이름으로 노출하고 선택값을 표시한다", () => {
    render(
      <FilterToggleGroup
        label="역할 필터"
        options={options}
        value="USER"
        onValueChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("group", { name: "역할 필터" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "일반회원" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "전체" })).not.toBeChecked();
  });

  it("다른 옵션을 누르면 그 값으로 onValueChange를 호출한다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <FilterToggleGroup
        label="역할 필터"
        options={options}
        value="ALL"
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "관리자" }));

    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith("ADMIN");
  });

  it("선택된 옵션을 다시 눌러도 선택을 해제하지 않는다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <FilterToggleGroup
        label="역할 필터"
        options={options}
        value="ADMIN"
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "관리자" }));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "관리자" })).toBeChecked();
  });
});
