import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveDemoSection } from "./LiveDemoSection";

describe("LiveDemoSection", () => {
  it("샘플 미리보기 링크가 새 창에서 열리도록 렌더링된다", () => {
    render(<LiveDemoSection />);

    const links = screen.getAllByRole("link", { name: /미리보기|열기/ });
    links.forEach((link) => {
      expect(link).toHaveAttribute("href", "/preview/sample");
      expect(link).toHaveAttribute("target", "_blank");
    });
  });
});
