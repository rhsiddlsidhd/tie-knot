import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalDocumentTemplate } from "./LegalDocumentTemplate";

const sections = [
  {
    heading: "목적",
    paragraphs: ["이 약관은 서비스 이용에 관한 조건을 규정합니다."],
  },
  {
    heading: "수집 항목",
    items: ["이름", "이메일", "전화번호"],
  },
];

describe("LegalDocumentTemplate", () => {
  it("title/effectiveDate와 섹션 heading·본문을 렌더링한다", () => {
    render(
      <LegalDocumentTemplate
        title="이용약관"
        effectiveDate="2026-08-21"
        sections={sections}
      />,
    );

    expect(screen.getByText("이용약관")).toBeInTheDocument();
    expect(screen.getByText(/2026-08-21/)).toBeInTheDocument();
    expect(screen.getByText("목적")).toBeInTheDocument();
    expect(
      screen.getByText("이 약관은 서비스 이용에 관한 조건을 규정합니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("수집 항목")).toBeInTheDocument();
    expect(screen.getByText("이름")).toBeInTheDocument();
    expect(screen.getByText("이메일")).toBeInTheDocument();
    expect(screen.getByText("전화번호")).toBeInTheDocument();
  });

  it("섹션이 여러 개면 모두 렌더링한다", () => {
    render(
      <LegalDocumentTemplate
        title="개인정보 처리방침"
        effectiveDate="2026-08-21"
        sections={sections}
      />,
    );

    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(2);
  });
});
