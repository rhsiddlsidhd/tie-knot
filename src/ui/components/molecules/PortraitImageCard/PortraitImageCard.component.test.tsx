import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortraitImageCard } from "./PortraitImageCard";

describe("PortraitImageCard", () => {
  it("이미지를 alt 텍스트와 함께 렌더링한다", () => {
    render(
      <PortraitImageCard
        src="https://example.com/thumb.jpg"
        alt="봄맞이 청첩장 썸네일"
        sizes="100vw"
      />,
    );

    expect(
      screen.getByRole("img", { name: "봄맞이 청첩장 썸네일" }),
    ).toBeInTheDocument();
  });

  it("children으로 전달한 오버레이 콘텐츠를 함께 렌더링한다", () => {
    render(
      <PortraitImageCard
        src="https://example.com/thumb.jpg"
        alt="썸네일"
        sizes="100vw"
      >
        <span>오버레이 버튼</span>
      </PortraitImageCard>,
    );

    expect(screen.getByText("오버레이 버튼")).toBeInTheDocument();
  });

  it("children을 전달하지 않아도 렌더링된다", () => {
    render(
      <PortraitImageCard
        src="https://example.com/thumb.jpg"
        alt="썸네일"
        sizes="100vw"
      />,
    );

    expect(screen.getByRole("img", { name: "썸네일" })).toBeInTheDocument();
  });
});
