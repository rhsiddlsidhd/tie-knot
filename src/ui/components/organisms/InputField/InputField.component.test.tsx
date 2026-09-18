import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InputField } from "./InputField";

describe("InputField", () => {
  it("입력 속성과 기본값을 렌더링한다", () => {
    render(
      <InputField
        id="price"
        name="price"
        label="가격"
        type="number"
        defaultValue={1000}
        min={0}
        step={100}
        required
      />,
    );

    const input = screen.getByLabelText("가격");
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("step", "100");
    expect(input).toBeRequired();
    expect(input).toHaveValue(1000);
  });

  it("value와 onChange가 전달되면 controlled input으로 동작한다", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <InputField
        id="title"
        name="title"
        label="상품명"
        value="봄"
        onChange={handleChange}
      />,
    );

    await user.type(screen.getByLabelText("상품명"), "날");
    expect(handleChange).toHaveBeenCalled();

    rerender(
      <InputField
        id="title"
        name="title"
        label="상품명"
        value="봄날"
        onChange={handleChange}
      />,
    );
    expect(screen.getByLabelText("상품명")).toHaveValue("봄날");
  });

  it("uncontrolled input은 form.reset으로 기본값을 복원한다", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <InputField
          id="title"
          name="title"
          label="상품명"
          defaultValue="초기값"
        />
        <button type="reset">초기화</button>
      </form>,
    );

    const input = screen.getByLabelText("상품명");
    await user.clear(input);
    await user.type(input, "변경값");
    await user.click(screen.getByRole("button", { name: "초기화" }));

    expect(input).toHaveValue("초기값");
  });

  it("error와 suffix를 렌더링한다", () => {
    render(
      <InputField
        id="price"
        name="price"
        label="가격"
        error="가격을 입력해주세요."
        suffix="원"
      />,
    );

    expect(screen.getByLabelText("가격")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByText("가격을 입력해주세요.")).toBeInTheDocument();
    expect(screen.getByText("원")).toBeInTheDocument();
  });
});
