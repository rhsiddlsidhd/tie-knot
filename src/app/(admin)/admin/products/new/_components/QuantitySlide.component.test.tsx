import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuantitySlide } from "./QuantitySlide";

const renderSlide = (
  overrides: Partial<Parameters<typeof QuantitySlide>[0]> = {},
) => {
  const dispatch = vi.fn();
  const view = render(
    <QuantitySlide
      state={null}
      minQuantity={1}
      isUnlimitedMax
      dispatch={dispatch}
      onPrevious={vi.fn()}
      {...overrides}
    />,
  );

  return { ...view, dispatch };
};

describe("QuantitySlide", () => {
  it("무제한이면 최대 수량 입력을 잠그고 0을 전송한다", () => {
    const { container } = renderSlide();

    expect(screen.getByPlaceholderText("무제한")).toBeDisabled();
    expect(container.querySelector("input[name='maxQuantity']")).toHaveValue(
      "0",
    );
  });

  it("무제한을 끄면 최대 수량을 직접 입력받는다", () => {
    renderSlide({ isUnlimitedMax: false, minQuantity: 3 });
    const maxQuantity = screen.getByLabelText(/최대 구매 수량/);

    expect(maxQuantity).toBeRequired();
    expect(maxQuantity).toHaveValue(3);
  });

  it("최소 수량이 비어 있으면 빈 입력으로 표시한다", () => {
    renderSlide({ minQuantity: NaN });

    expect(screen.getByLabelText(/최소 구매 수량/)).toHaveValue(null);
  });

  it("최소 수량을 입력하면 CHANGE_MIN_QUANTITY를 보낸다", async () => {
    const user = userEvent.setup();
    const { dispatch } = renderSlide({ minQuantity: NaN });

    await user.type(screen.getByLabelText(/최소 구매 수량/), "5");

    expect(dispatch).toHaveBeenCalledWith({
      type: "CHANGE_MIN_QUANTITY",
      payload: 5,
    });
  });

  it("무제한 체크를 해제하면 TOGGLE_UNLIMITED_MAX를 보낸다", async () => {
    const user = userEvent.setup();
    const { dispatch } = renderSlide();

    await user.click(screen.getByLabelText("무제한"));

    expect(dispatch).toHaveBeenCalledWith({
      type: "TOGGLE_UNLIMITED_MAX",
      payload: false,
    });
  });
});
