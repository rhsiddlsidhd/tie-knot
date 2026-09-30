import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FilterSelectOption } from "./FilterSelect";
import { FilterSelect } from "./FilterSelect";

const options: readonly FilterSelectOption<"USER" | "ADMIN">[] = [
  { value: "USER", label: "일반회원" },
  { value: "ADMIN", label: "관리자" },
];

describe("FilterSelect", () => {
  it("label을 접근 가능한 이름으로 노출하고 현재 선택값을 표시한다", () => {
    render(
      <FilterSelect
        ariaLabel="역할 필터"
        allOptionLabel="전체"
        options={options}
        value="USER"
        onValueChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "역할 필터" }),
    ).toBeInTheDocument();
    expect(screen.getByText("일반회원")).toBeInTheDocument();
  });

  it("다른 옵션을 선택하면 그 값으로 onValueChange를 호출한다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <FilterSelect
        ariaLabel="역할 필터"
        allOptionLabel="전체"
        options={options}
        value={null}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "관리자" }));

    expect(onValueChange).toHaveBeenCalledWith("ADMIN");
  });

  it("null 옵션 선택 시 null을 전달한다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <FilterSelect
        ariaLabel="역할 필터"
        allOptionLabel="전체"
        options={options}
        value="ADMIN"
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "전체" }));

    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  it("실제 옵션 값이 전체 옵션의 예약값과 같아도 구분한다", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <FilterSelect
        ariaLabel="예약값 필터"
        allOptionLabel="전체"
        options={[{ value: "__all__", label: "예약값" }]}
        value={null}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "예약값" }));

    expect(onValueChange).toHaveBeenCalledWith("__all__");
  });
});
