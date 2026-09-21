import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveDemoSection } from "./LiveDemoSection";

describe("LiveDemoSection", () => {
  it("이미지 없이 샘플 미리보기 CTA만 렌더링한다", () => {
    render(<LiveDemoSection />);

    const link = screen.getByRole("link", { name: "샘플 미리보기" });

    expect(link).toHaveAttribute("href", "/preview/sample");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
