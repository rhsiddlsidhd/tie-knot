import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import promotionsData from "@/core/content/promotions.json";
import type { Promotion } from "@/core/domain/promotion";
import { PromotionHero } from "./PromotionHero";

describe("PromotionHero", () => {
  it("첫 번째 활성 프로모션의 CTA를 해당 href로 이동하는 링크로 렌더링한다", () => {
    const firstActivePromo = (promotionsData as Promotion[]).find(
      (p) => p.isActive,
    )!;

    render(<PromotionHero />);

    // embla-carousel의 loop 옵션이 무한 스크롤용 clone 슬라이드를 추가로 렌더하므로
    // 같은 CTA 링크가 여러 개 나올 수 있다 — 첫 번째 것만 확인한다.
    const [cta] = screen.getAllByRole("link", {
      name: firstActivePromo.cta.label,
    });
    expect(cta).toHaveAttribute("href", firstActivePromo.cta.href);
  });
});
