import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";

// MobileInvitationTemplate은 여러 실제 섹션 컴포넌트를 조합만 하는 최상위
// 템플릿이다 — 각 하위 섹션 자체의 behavior(데이터 렌더링, interaction)는
// 그 섹션의 개별 component test가 이미 커버하므로, 여기서는 (1) theme이
// wrapper와 ThemeSync/ThemeAmbience/InteractionOverlay에 올바르게 전달되는지,
// (2) content로부터 계산한 props가 각 섹션에 올바르게 배선되는지,
// (3) guestbookEnabled/features 조건부 조립만 검증한다. 이를 위해 하위 섹션을
// 실제 UI 대신 받은 props를 노출하는 stub으로 대체한다.
vi.mock(
  "@/app/(preview)/preview/[publicKey]/_components/interactions/InteractionOverlay",
  () => ({
    InteractionOverlay: ({ theme }: { theme: string }) => (
      <div data-testid="interaction-overlay" data-theme={theme} />
    ),
  }),
);
vi.mock("./ThemeAmbience", () => ({
  ThemeAmbience: ({ theme }: { theme: string }) => (
    <div data-testid="theme-ambience" data-theme={theme} />
  ),
}));
vi.mock("./ThemeSync", () => ({
  ThemeSync: ({ theme }: { theme: string }) => (
    <div data-testid="theme-sync" data-theme={theme} />
  ),
}));
vi.mock("@/app/(preview)/preview/[publicKey]/_components/AccountSection", () => ({
  AccountSection: (props: { groomAccounts: unknown[]; brideAccounts: unknown[] }) => (
    <div data-testid="account-section">
      {props.groomAccounts.length}/{props.brideAccounts.length}
    </div>
  ),
}));
vi.mock("@/app/(preview)/preview/[publicKey]/_components/Footer", () => ({
  Footer: ({ children }: { children: ReactNode }) => (
    <footer data-testid="footer">{children}</footer>
  ),
}));
vi.mock("@/app/(preview)/preview/[publicKey]/_components/GallerySection", () => ({
  GallerySection: (props: { images: string[]; lightboxEnabled: boolean }) => (
    <div data-testid="gallery-section" data-lightbox={String(props.lightboxEnabled)}>
      {props.images.join(",")}
    </div>
  ),
}));
vi.mock("@/app/(preview)/preview/[publicKey]/_components/GuestbookSection", () => ({
  GuestbookSection: (props: { publicKey: string }) => (
    <div data-testid="guestbook-section">{props.publicKey}</div>
  ),
}));
vi.mock("@/app/(preview)/preview/[publicKey]/_components/HeroSection", () => ({
  HeroSection: (props: { groomName: string; brideName: string }) => (
    <div data-testid="hero-section">
      {props.groomName}-{props.brideName}
    </div>
  ),
}));
vi.mock("@/app/(preview)/preview/[publicKey]/_components/MobileInvitationMessage", () => ({
  MobileInvitationMessage: (props: { parties: { name: string }[] }) => (
    <div data-testid="invitation-message">
      {props.parties.map((party) => party.name).join(",")}
    </div>
  ),
}));
vi.mock("@/app/(preview)/preview/[publicKey]/_components/LocationSection", () => ({
  LocationSection: (props: { venueName: string }) => (
    <div data-testid="location-section">{props.venueName}</div>
  ),
}));
vi.mock("@/app/(preview)/preview/[publicKey]/_components/WeddingMonthCalendar", () => ({
  WeddingMonthCalendar: () => <div data-testid="wedding-month-calendar" />,
}));

import { MobileInvitationTemplate } from "./MobileInvitationTemplate";

const baseContent: MobileInvitationContent = {
  groom: {
    name: "김철수",
    phone: "010-1111-2222",
    bankName: "국민은행",
    accountNumber: "111-111-111",
  },
  bride: {
    name: "이영희",
    phone: "010-3333-4444",
    bankName: "신한은행",
    accountNumber: "222-222-222",
  },
  weddingDate: new Date("2026-11-01T05:00:00.000Z"),
  venue: "그랜드홀",
  address: "서울시 강남구",
  addressDetail: "3층",
  subwayStation: "강남",
  guestbookEnabled: true,
  thumbnailImages: ["/hero.jpg", "/divider.jpg", "/footer.jpg"],
  galleryImages: ["/gallery-1.jpg", "/gallery-2.jpg"],
  theme: "botanical",
};

describe("MobileInvitationTemplate", () => {
  it("theme을 wrapper의 data-theme과 ThemeSync/ThemeAmbience/InteractionOverlay에 전달한다", () => {
    const { container } = render(
      <MobileInvitationTemplate
        content={baseContent}
        publicKey="public-key-1"
        features={[]}
        theme="botanical"
      />,
    );

    expect(container.querySelector('[data-theme="botanical"]')).not.toBeNull();
    expect(screen.getByTestId("theme-sync")).toHaveAttribute("data-theme", "botanical");
    expect(screen.getByTestId("theme-ambience")).toHaveAttribute("data-theme", "botanical");
    expect(screen.getByTestId("interaction-overlay")).toHaveAttribute(
      "data-theme",
      "botanical",
    );
  });

  it("content에서 매핑한 props를 각 섹션에 전달한다", () => {
    render(
      <MobileInvitationTemplate
        content={baseContent}
        publicKey="public-key-1"
        features={[]}
        theme="botanical"
      />,
    );

    expect(screen.getByTestId("hero-section")).toHaveTextContent("김철수-이영희");
    expect(screen.getByTestId("location-section")).toHaveTextContent("그랜드홀");
    expect(screen.getByTestId("invitation-message")).toHaveTextContent("김철수,이영희");
    expect(screen.getByTestId("account-section")).toHaveTextContent("1/1");
    expect(screen.getByTestId("guestbook-section")).toHaveTextContent("public-key-1");
  });

  it("guestbookEnabled가 true면 방명록 섹션을 렌더링한다", () => {
    render(
      <MobileInvitationTemplate
        content={{ ...baseContent, guestbookEnabled: true }}
        publicKey="public-key-1"
        features={[]}
        theme="default"
      />,
    );

    expect(screen.getByTestId("guestbook-section")).toBeInTheDocument();
  });

  it("guestbookEnabled가 false면 방명록 섹션을 렌더링하지 않는다", () => {
    render(
      <MobileInvitationTemplate
        content={{ ...baseContent, guestbookEnabled: false }}
        publicKey="public-key-1"
        features={[]}
        theme="default"
      />,
    );

    expect(screen.queryByTestId("guestbook-section")).not.toBeInTheDocument();
  });

  it("features에 GALLERY_LIGHTBOX가 포함되면 갤러리 라이트박스를 활성화한다", () => {
    render(
      <MobileInvitationTemplate
        content={baseContent}
        publicKey="public-key-1"
        features={["GALLERY_LIGHTBOX"]}
        theme="default"
      />,
    );

    expect(screen.getByTestId("gallery-section")).toHaveAttribute("data-lightbox", "true");
  });

  it("features에 GALLERY_LIGHTBOX가 없으면 갤러리 라이트박스를 비활성화한다", () => {
    render(
      <MobileInvitationTemplate
        content={baseContent}
        publicKey="public-key-1"
        features={[]}
        theme="default"
      />,
    );

    expect(screen.getByTestId("gallery-section")).toHaveAttribute("data-lightbox", "false");
  });

  it("구분 이미지와 footer 썸네일 이미지를 실제로 렌더링한다", () => {
    const { container } = render(
      <MobileInvitationTemplate
        content={baseContent}
        publicKey="public-key-1"
        features={[]}
        theme="default"
      />,
    );

    // next/image가 src를 "/_next/image?url=<encoded>&w=..&q=.." 형태로 변환하므로
    // 원본 경로는 url 쿼리파라미터 안의 인코딩된 부분 문자열로만 확인할 수 있다.
    expect(container.querySelector('img[src*="url=%2Fdivider.jpg"]')).not.toBeNull();
    expect(
      screen.getByTestId("footer").querySelector('img[src*="url=%2Ffooter.jpg"]'),
    ).not.toBeNull();
  });
});
