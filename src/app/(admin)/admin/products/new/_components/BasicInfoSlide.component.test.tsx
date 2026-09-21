import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import { BasicInfoSlide } from "./BasicInfoSlide";

const renderSlide = (
  overrides: Partial<Parameters<typeof BasicInfoSlide>[0]> = {},
) => {
  const dispatch = vi.fn();
  const onNext = vi.fn();
  render(
    <BasicInfoSlide
      state={null}
      category={MOBILE_INVITATION_CATEGORY}
      subCategory=""
      theme="default"
      isMobileInvitation
      dispatch={dispatch}
      onNext={onNext}
      {...overrides}
    />,
  );

  return { dispatch, onNext };
};

describe("BasicInfoSlide", () => {
  it("상품명과 설명 입력을 필수로 요구한다", () => {
    renderSlide();

    expect(screen.getByLabelText(/상품명/)).toBeRequired();
    expect(screen.getByLabelText(/상품 설명/)).toBeRequired();
  });

  it("모바일 청첩장이면 테마 선택을 노출한다", () => {
    renderSlide();

    expect(screen.getByText("테마")).toBeInTheDocument();
  });

  it("실물 상품이면 테마 선택을 감춘다", () => {
    renderSlide({ isMobileInvitation: false, category: "favor" });

    expect(screen.queryByText("테마")).not.toBeInTheDocument();
  });

  it("스텝 오류 메시지를 서브 카테고리 아래 표시한다", () => {
    renderSlide({ stepError: "서브 카테고리를 선택해주세요." });

    expect(
      screen.getByText("서브 카테고리를 선택해주세요."),
    ).toBeInTheDocument();
  });

  it("다음 버튼을 누르면 onNext를 호출한다", async () => {
    const user = userEvent.setup();
    const { onNext } = renderSlide();

    await user.click(screen.getByRole("button", { name: "다음: 가격 정보" }));

    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
