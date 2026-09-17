import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { ALL_NAVIGATE_ITEMS } from "@/core/domain/navigation";
import { MobileMenuContent } from "./MobileMenuContent";

const leafItem = ALL_NAVIGATE_ITEMS.MAIN.links[0]!;
const groupItem = ALL_NAVIGATE_ITEMS.MAIN.groups[0]!;

describe("MobileMenuContent", () => {
  it("로고는 홈으로 이동하는 링크다", () => {
    render(<MobileMenuContent onClose={vi.fn()} />);

    expect(screen.getByRole("link", { name: "Tie Knot" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("MAIN 메뉴 항목과 하단 카피 문구를 표시한다", () => {
    render(<MobileMenuContent onClose={vi.fn()} />);

    expect(
      screen.getByRole("link", { name: new RegExp(leafItem.label) }),
    ).toHaveAttribute("href", leafItem.href);
    expect(
      screen.getByText("매듭을 맺다 & 웨딩 이커머스"),
    ).toBeInTheDocument();
  });

  it("서브카테고리 있는 항목은 아코디언 트리거로 보여주고 펼치면 링크가 나타난다", async () => {
    const user = userEvent.setup();
    render(<MobileMenuContent onClose={vi.fn()} />);

    expect(
      screen.queryByRole("link", { name: new RegExp(groupItem.label) }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: new RegExp(groupItem.label) }),
    );

    for (const sub of groupItem.submenu) {
      expect(screen.getByRole("link", { name: sub.label })).toHaveAttribute(
        "href",
        sub.href,
      );
    }
  });

  it("닫기 버튼 클릭 시 onClose를 호출한다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<MobileMenuContent onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "메뉴 닫기" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("링크 클릭 시 onNavigate를 호출한다", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<MobileMenuContent onClose={vi.fn()} onNavigate={onNavigate} />);

    await user.click(
      screen.getByRole("link", { name: new RegExp(leafItem.label) }),
    );

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
