import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";
import { MOBILE_INVITATION_THEMES } from "@/core/domain/theme";

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

// MobileInvitationTemplate은 GallerySection·AccountSection 등 실제 하위
// organism 트리 전체를 조립한다 — 이 페이지 테스트의 대상은 "[theme] 세그먼트에
// 따라 어떤 props로 Template을 호출하는가"이지 Template 내부 렌더링이 아니므로,
// products/[category]/page.component.test.tsx와 동일하게 Template 경계를
// stub으로 대체하고 전달받은 props만 관찰한다.
vi.mock(
  "@/app/(preview)/preview/[publicKey]/_components/MobileInvitationTemplate",
  () => ({
    MobileInvitationTemplate: ({
      content,
      publicKey,
      features,
      theme,
    }: {
      content: MobileInvitationContent;
      publicKey: string;
      features: string[];
      theme: string;
    }) => (
      <div>
        Template:theme={theme}:publicKey={publicKey}:features=
        {features.join(",")}:venue={content.venue}
      </div>
    ),
  }),
);

import Page from "./page";

const buildParams = (theme: string) => Promise.resolve({ theme });

describe("sample/[theme] 프리뷰 페이지", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
  });

  it("등록되지 않은 테마 세그먼트면 notFound를 호출한다", async () => {
    await expect(Page({ params: buildParams("not-a-theme") })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("등록된 테마 세그먼트면 sample 고정 콘텐츠와 그 테마로 Template을 렌더한다", async () => {
    render(await Page({ params: buildParams("botanical") }));

    expect(
      screen.getByText(
        "Template:theme=botanical:publicKey=sample:features=HORIZONTAL_SLIDE:venue=타이노트 웨딩홀",
      ),
    ).toBeInTheDocument();
  });

  it.each(MOBILE_INVITATION_THEMES)(
    "등록된 테마 '%s' 각각에 대해 notFound 없이 렌더한다",
    async (theme) => {
      render(await Page({ params: buildParams(theme) }));

      expect(screen.getByText(new RegExp(`Template:theme=${theme}:`))).toBeInTheDocument();
      expect(notFoundMock).not.toHaveBeenCalled();
    },
  );
});
