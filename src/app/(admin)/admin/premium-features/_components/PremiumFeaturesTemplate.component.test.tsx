import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AdminPremiumFeatureListPage } from "@/core/domain/premium-feature";

vi.mock(
  "@/app/(admin)/admin/premium-features/_containers/PremiumFeatureRowAction",
  () => ({
    PremiumFeatureRowAction: () => <button type="button">수정</button>,
  }),
);

import { PremiumFeaturesTemplate } from "./PremiumFeaturesTemplate";

const buildPage = (
  overrides?: Partial<AdminPremiumFeatureListPage>,
): AdminPremiumFeatureListPage => ({
  items: [
    {
      _id: "feature-1",
      code: "GUESTBOOK",
      label: "방명록",
      description: "하객들이 남기는 방명록 기능을 추가합니다.",
      additionalPrice: 3000,
      isActive: true,
      createdAt: new Date("2026-08-19T15:30:00.000Z").toISOString(), // KST 2026-08-20
    },
  ],
  nextCursor: null,
  ...overrides,
});

describe("PremiumFeaturesTemplate", () => {
  it("기능 행을 실제 props 기준으로 렌더링하고 등록일을 KST로 표시한다", () => {
    render(<PremiumFeaturesTemplate page={buildPage()} />);

    expect(screen.getByText("GUESTBOOK")).toBeInTheDocument();
    expect(screen.getByText("방명록")).toBeInTheDocument();
    expect(
      screen.getByText("하객들이 남기는 방명록 기능을 추가합니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("+3,000원")).toBeInTheDocument();
    expect(screen.getByText("2026.8.20")).toBeInTheDocument();
  });

  it("isActive에 따라 등록 가능/등록 중단 상태를 표시한다", () => {
    const page = buildPage();
    render(
      <PremiumFeaturesTemplate
        page={{
          ...page,
          items: [
            page.items[0],
            {
              ...page.items[0],
              _id: "feature-2",
              code: "MAP",
              isActive: false,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("등록 가능")).toBeInTheDocument();
    expect(screen.getByText("등록 중단")).toBeInTheDocument();
  });

  it("항목이 없으면 빈 상태 UI를 보여준다", () => {
    render(<PremiumFeaturesTemplate page={buildPage({ items: [] })} />);

    expect(screen.getByText("등록된 기능이 없습니다")).toBeInTheDocument();
  });

  it("nextCursor가 없으면 다음 페이지 버튼이 비활성화된다", () => {
    render(<PremiumFeaturesTemplate page={buildPage({ nextCursor: null })} />);

    expect(screen.getByRole("button", { name: "다음 페이지" })).toBeDisabled();
  });

  it("기능 등록 페이지로 가는 링크를 노출한다", () => {
    render(<PremiumFeaturesTemplate page={buildPage()} />);

    expect(screen.getByRole("link", { name: /기능 등록/ })).toHaveAttribute(
      "href",
      "/admin/premium-features/new",
    );
  });
});
