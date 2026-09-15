import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProductFormSlideCard } from "./ProductFormSlideCard";

describe("ProductFormSlideCard", () => {
  it("제목과 설명과 입력 영역을 렌더링한다", () => {
    render(
      <ProductFormSlideCard
        step="basic"
        title="기본 정보"
        description="상품 정보를 입력합니다."
      >
        <input aria-label="상품명" />
      </ProductFormSlideCard>,
    );

    expect(screen.getByText("기본 정보")).toBeInTheDocument();
    expect(screen.getByText("상품 정보를 입력합니다.")).toBeInTheDocument();
    expect(screen.getByLabelText("상품명")).toBeInTheDocument();
  });

  it("step을 검증 대상 식별자로 노출한다", () => {
    const { container } = render(
      <ProductFormSlideCard step="pricing" title="가격">
        내용
      </ProductFormSlideCard>,
    );

    expect(
      container.querySelector("[data-product-form-step='pricing']"),
    ).toBeInTheDocument();
  });

  it("required면 제목에 필수 아이콘을 표시한다", () => {
    const { container } = render(
      <ProductFormSlideCard step="basic" title="기본 정보" required>
        내용
      </ProductFormSlideCard>,
    );

    expect(
      container.querySelector("[data-slot='card-title'] svg"),
    ).toBeInTheDocument();
  });

  it("탐색 핸들러가 없으면 이전·다음 버튼을 표시하지 않는다", () => {
    render(
      <ProductFormSlideCard step="basic" title="기본 정보">
        내용
      </ProductFormSlideCard>,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("다음 버튼을 누르면 onNext를 호출한다", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(
      <ProductFormSlideCard
        step="basic"
        title="기본 정보"
        nextLabel="가격"
        onNext={onNext}
      >
        내용
      </ProductFormSlideCard>,
    );

    await user.click(screen.getByRole("button", { name: "다음: 가격" }));

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("이전 버튼을 누르면 onPrevious를 호출한다", async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    render(
      <ProductFormSlideCard
        step="pricing"
        title="가격"
        previousLabel="기본 정보"
        onPrevious={onPrevious}
      >
        내용
      </ProductFormSlideCard>,
    );

    await user.click(screen.getByRole("button", { name: "이전: 기본 정보" }));

    expect(onPrevious).toHaveBeenCalledTimes(1);
  });
});
