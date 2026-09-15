import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import { PricingSlide } from "./PricingSlide";

const premiumFeatures = [
  {
    _id: "feature-1",
    code: "music",
    label: "배경 음악",
    price: 5000,
  },
] as unknown as PremiumFeature[];

const renderSlide = (
  overrides: Partial<Parameters<typeof PricingSlide>[0]> = {},
) => {
  const dispatch = vi.fn();
  const onNext = vi.fn();
  const onPrevious = vi.fn();
  render(
    <PricingSlide
      state={null}
      premiumFeatures={premiumFeatures}
      isPremium={false}
      featureIds={[]}
      priceInputError={null}
      dispatch={dispatch}
      onPrevious={onPrevious}
      onNext={onNext}
      {...overrides}
    />,
  );

  return { dispatch, onNext, onPrevious };
};

describe("PricingSlide", () => {
  it("프리미엄이 꺼져 있으면 옵션 목록을 감춘다", () => {
    renderSlide();

    expect(screen.queryByText("프리미엄 기능 선택")).not.toBeInTheDocument();
  });

  it("프리미엄이 켜져 있으면 옵션 목록을 노출한다", () => {
    renderSlide({ isPremium: true });

    expect(screen.getByText("프리미엄 기능 선택")).toBeInTheDocument();
    expect(screen.getByLabelText("배경 음악")).toBeInTheDocument();
  });

  it("선택된 옵션은 체크 상태로 표시한다", () => {
    renderSlide({ isPremium: true, featureIds: ["feature-1"] });

    expect(screen.getByLabelText("배경 음악")).toBeChecked();
  });

  it("가격 입력 오류를 그대로 보여준다", () => {
    renderSlide({ priceInputError: "가격은 원 단위 정수로 입력해주세요." });

    expect(
      screen.getByText("가격은 원 단위 정수로 입력해주세요."),
    ).toBeInTheDocument();
  });

  it("옵션을 체크하면 TOGGLE_PREMIUM_FEATURE를 보낸다", async () => {
    const user = userEvent.setup();
    const { dispatch } = renderSlide({ isPremium: true });

    await user.click(screen.getByLabelText("배경 음악"));

    expect(dispatch).toHaveBeenCalledWith({
      type: "TOGGLE_PREMIUM_FEATURE",
      payload: { id: "feature-1", checked: true },
    });
  });

  it("이전·다음 버튼이 각각의 핸들러를 호출한다", async () => {
    const user = userEvent.setup();
    const { onPrevious, onNext } = renderSlide();

    await user.click(screen.getByRole("button", { name: "이전: 기본 정보" }));
    await user.click(screen.getByRole("button", { name: "다음: 노출 설정" }));

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
