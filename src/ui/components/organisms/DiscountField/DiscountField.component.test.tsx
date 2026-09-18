import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DiscountField } from "./DiscountField";

describe("DiscountField", () => {
  it("비율 할인의 폼 값과 입력 제약을 렌더링한다", () => {
    const { container } = render(
      <form>
        <DiscountField
          idPrefix="product"
          defaultType="rate"
          defaultValue={0.1}
        />
      </form>,
    );

    expect(screen.getByLabelText("할인")).toHaveValue(0.1);
    expect(screen.getByLabelText("할인")).toHaveAttribute("step", "0.01");
    expect(screen.getByLabelText("할인")).toHaveAttribute("max", "1");
    expect(
      container.querySelectorAll('[name="discount.discountType"]'),
    ).toHaveLength(1);
    expect(container.querySelector('[name="discount.value"]')).not.toBeNull();
  });

  it("금액 할인으로 바꾸면 단위와 제약을 변경하고 소수를 검증한다", async () => {
    const user = userEvent.setup();
    render(
      <DiscountField idPrefix="product" defaultType="rate" defaultValue={0} />,
    );

    await user.click(screen.getByRole("combobox", { name: "할인 방식" }));
    await user.click(await screen.findByRole("option", { name: "금액 (원)" }));

    const input = screen.getByLabelText("할인");
    expect(input).toHaveAttribute("step", "1");
    expect(input).not.toHaveAttribute("max");
    expect(screen.getByText("차감 금액 입력")).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "1000.5");

    expect(
      screen.getByText("할인액은 원 단위 정수로 입력해주세요."),
    ).toBeInTheDocument();
  });

  it("서버 오류를 입력과 선택기에 전달한다", () => {
    render(
      <DiscountField
        idPrefix="product"
        defaultType="rate"
        defaultValue={0}
        error="할인값을 확인해주세요."
      />,
    );

    expect(screen.getByLabelText("할인")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("combobox", { name: "할인 방식" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByText("할인값을 확인해주세요.")).toBeInTheDocument();
  });

  it("form을 초기화하면 기본 할인 방식과 로컬 오류를 복원한다", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <DiscountField idPrefix="product" defaultType="rate" defaultValue={0} />
        <button type="reset">초기화</button>
      </form>,
    );

    await user.click(screen.getByRole("combobox", { name: "할인 방식" }));
    await user.click(await screen.findByRole("option", { name: "금액 (원)" }));
    await user.type(screen.getByLabelText("할인"), "0.5");
    expect(
      screen.getByText("할인액은 원 단위 정수로 입력해주세요."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "초기화" }));

    expect(
      screen.getByRole("combobox", { name: "할인 방식" }),
    ).toHaveTextContent("비율 (%)");
    expect(
      screen.queryByText("할인액은 원 단위 정수로 입력해주세요."),
    ).not.toBeInTheDocument();
  });
});
