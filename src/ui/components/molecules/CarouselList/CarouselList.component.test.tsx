import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CarouselList } from "./CarouselList";

describe("CarouselList", () => {
  it("data 배열을 순서대로 renderItem으로 렌더링한다", () => {
    render(
      <CarouselList
        id="test-carousel"
        data={["첫번째", "두번째", "세번째"]}
        renderItem={(item) => <span>{item}</span>}
      />,
    );

    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(3);
    expect(groups[0]).toHaveTextContent("첫번째");
    expect(groups[1]).toHaveTextContent("두번째");
    expect(groups[2]).toHaveTextContent("세번째");
  });

  it("id로 heading과 연결된 region 랜드마크를 렌더링하고 data-id 속성을 붙인다", () => {
    render(
      <>
        <h2 id="section-heading">섹션 제목</h2>
        <CarouselList
          id="section-heading"
          data={["항목"]}
          renderItem={(item) => <span>{item}</span>}
        />
      </>,
    );

    const region = screen.getByRole("region", { name: "섹션 제목" });
    expect(region).toHaveAttribute("data-id", "section-heading");
  });

  it("className을 기본 basis-auto와 병합해 각 item에 적용한다", () => {
    render(
      <CarouselList
        id="test-carousel"
        data={["항목"]}
        className="w-1/3"
        renderItem={(item) => <span>{item}</span>}
      />,
    );

    const group = screen.getByRole("group");
    expect(group).toHaveClass("basis-auto", "w-1/3");
  });

  it("renderItem에 item과 index를 전달한다", () => {
    render(
      <CarouselList
        id="test-carousel"
        data={["a", "b"]}
        renderItem={(item, index) => <span>{`${index}-${item}`}</span>}
      />,
    );

    expect(screen.getByText("0-a")).toBeInTheDocument();
    expect(screen.getByText("1-b")).toBeInTheDocument();
  });

  it("opts로 기본값(loop:false 등)을 덮어써도 정상 렌더링된다", () => {
    render(
      <CarouselList
        id="test-carousel"
        data={["항목"]}
        opts={{ loop: true }}
        renderItem={(item) => <span>{item}</span>}
      />,
    );

    expect(screen.getByRole("group")).toHaveTextContent("항목");
  });
});
