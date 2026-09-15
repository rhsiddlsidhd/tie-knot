import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormSectionCard } from "./FormSectionCard";

describe("FormSectionCard", () => {
  it("제목과 설명과 입력 영역을 렌더링한다", () => {
    render(
      <FormSectionCard title="기본 정보" description="상품 정보를 입력합니다.">
        <input aria-label="상품명" />
      </FormSectionCard>,
    );

    expect(screen.getByText("기본 정보")).toBeInTheDocument();
    expect(screen.getByText("상품 정보를 입력합니다.")).toBeInTheDocument();
    expect(screen.getByLabelText("상품명")).toBeInTheDocument();
  });

  it("required면 제목에 필수 아이콘을 표시한다", () => {
    const { container } = render(
      <FormSectionCard title="기본 정보" required>
        내용
      </FormSectionCard>,
    );

    expect(
      container.querySelector("[data-slot='card-title'] svg"),
    ).toBeInTheDocument();
  });
});
