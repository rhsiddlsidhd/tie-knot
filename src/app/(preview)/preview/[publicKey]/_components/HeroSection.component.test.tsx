import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatInTimeZone } from "date-fns-tz";
import { ko } from "date-fns/locale";
import { HeroSection } from "./HeroSection";

const baseProps = {
  groomName: "김철수",
  brideName: "이영희",
  weddingDate: new Date("2026-11-01T05:00:00.000Z"),
  venueName: "그랜드홀",
  address: "서울시 강남구",
  thumbnailImage: "/hero.jpg",
};

describe("HeroSection", () => {
  it("신랑/신부 이름과 예식 일시·장소를 렌더링한다", () => {
    render(<HeroSection {...baseProps} addressDetail="3층" />);

    // groomName/brideName은 "&" 텍스트와 같은 부모(h1) 아래 형제 텍스트 노드로
    // 섞여 있어, 소속 element의 정확한 textContent가 "김철수"가 아니라
    // "김철수 & 이영희"가 된다 — getByText 정확 일치 대신 heading의 textContent
    // 포함 여부로 검증한다.
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(baseProps.groomName);
    expect(heading).toHaveTextContent(baseProps.brideName);

    expect(screen.getByText(baseProps.venueName)).toBeInTheDocument();
    expect(screen.getByText(baseProps.address)).toBeInTheDocument();
    expect(screen.getByText("3층")).toBeInTheDocument();

    const expectedDate = formatInTimeZone(
      baseProps.weddingDate,
      "Asia/Seoul",
      "yyyy. MM. dd EEEE a h시",
      { locale: ko },
    );
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it("주소 상세가 없으면 상세 주소를 렌더링하지 않는다", () => {
    render(<HeroSection {...baseProps} />);

    expect(screen.getByText(baseProps.address)).toBeInTheDocument();
    expect(screen.queryByText("3층")).not.toBeInTheDocument();
  });
});
