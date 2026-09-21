import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SheetPanel } from "./SheetPanel";

describe("SheetPanel", () => {
  it("트리거 클릭 시 Sheet가 열리고 title과 children이 렌더된다", async () => {
    const user = userEvent.setup();
    render(
      <SheetPanel>
        <p>본문 콘텐츠</p>
      </SheetPanel>,
    );

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));

    expect(
      screen.getByRole("heading", { name: "메뉴" }),
    ).toBeInTheDocument();
    expect(screen.getByText("본문 콘텐츠")).toBeInTheDocument();
  });

  it("셸의 커스텀 닫기 버튼 클릭 시 패널이 닫힌다", async () => {
    const user = userEvent.setup();
    render(
      <SheetPanel>
        <p>본문 콘텐츠</p>
      </SheetPanel>,
    );

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    expect(screen.getByText("본문 콘텐츠")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "메뉴 닫기" }));

    expect(screen.queryByText("본문 콘텐츠")).not.toBeInTheDocument();
  });

  it("로고가 홈으로 이동하는 링크로 렌더된다", async () => {
    const user = userEvent.setup();
    render(
      <SheetPanel>
        <p>본문 콘텐츠</p>
      </SheetPanel>,
    );

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));

    expect(screen.getByRole("link", { name: "Tie Knot" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("hiddenFrom breakpoint가 트리거 className에 반영된다", () => {
    render(
      <SheetPanel hiddenFrom="lg">
        <p>본문 콘텐츠</p>
      </SheetPanel>,
    );

    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveClass(
      "lg:hidden",
    );
  });
});
