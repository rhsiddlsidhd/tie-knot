import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("children을 렌더링한다", () => {
    render(
      <Footer>
        <div data-testid="footer-decoration">배경 장식</div>
      </Footer>,
    );

    expect(screen.getByTestId("footer-decoration")).toBeInTheDocument();
  });

  it("서비스 브랜드명과 저작권 문구를 렌더링한다", () => {
    render(<Footer>{null}</Footer>);

    expect(screen.getByText("Tie Knot")).toBeInTheDocument();
    expect(
      screen.getByText("© 2026 Wedding Invitation Service. All rights reserved."),
    ).toBeInTheDocument();
  });
});
