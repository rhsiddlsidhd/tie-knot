import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VisibilitySlide } from "./VisibilitySlide";

const renderSlide = (
  overrides: Partial<Parameters<typeof VisibilitySlide>[0]> = {},
) => {
  const dispatch = vi.fn();
  render(
    <VisibilitySlide
      state={null}
      isFeature={false}
      dispatch={dispatch}
      onPrevious={vi.fn()}
      onNext={vi.fn()}
      {...overrides}
    />,
  );

  return { dispatch };
};

describe("VisibilitySlide", () => {
  it("추천 상품 토글의 현재 상태를 반영한다", () => {
    renderSlide({ isFeature: true });

    expect(screen.getByRole("switch", { name: /추천 상품/ })).toBeChecked();
  });

  it("추천 상품을 켜면 TOGGLE_FEATURED를 보낸다", async () => {
    const user = userEvent.setup();
    const { dispatch } = renderSlide();

    await user.click(screen.getByRole("switch", { name: /추천 상품/ }));

    expect(dispatch).toHaveBeenCalledWith({
      type: "TOGGLE_FEATURED",
      payload: true,
    });
  });

  it("우선순위 입력은 0에서 100 사이로 제한한다", () => {
    renderSlide();
    const priority = screen.getByLabelText(/추천 우선순위/);

    expect(priority).toHaveAttribute("min", "0");
    expect(priority).toHaveAttribute("max", "100");
  });
});
