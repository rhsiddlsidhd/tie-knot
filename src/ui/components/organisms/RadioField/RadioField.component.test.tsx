import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RadioField, type RadioFieldOption } from "./RadioField";

const options: RadioFieldOption[] = [
  { id: "cash", value: "cash", title: "현금" },
  { id: "card", value: "card", title: "카드", description: "국내 카드만 가능" },
];

describe("RadioField", () => {
  it("각 옵션의 제목을 표시한다", () => {
    render(<RadioField id="pay" name="pay" options={options} />);

    expect(screen.getByRole("radio", { name: "현금" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /카드/ })).toBeInTheDocument();
  });

  it("description이 있으면 함께 표시한다", () => {
    render(<RadioField id="pay" name="pay" options={options} />);

    expect(screen.getByText("국내 카드만 가능")).toBeInTheDocument();
  });

  it("defaultValue로 지정한 옵션이 처음부터 선택돼 있다", () => {
    render(<RadioField id="pay" name="pay" options={options} defaultValue="cash" />);

    expect(screen.getByRole("radio", { name: "현금" })).toBeChecked();
  });

  it("다른 옵션을 클릭하면 선택 상태가 전환된다", async () => {
    const user = userEvent.setup();
    render(<RadioField id="pay" name="pay" options={options} defaultValue="cash" />);

    await user.click(screen.getByRole("radio", { name: /카드/ }));

    expect(screen.getByRole("radio", { name: /카드/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: "현금" })).not.toBeChecked();
  });
});
