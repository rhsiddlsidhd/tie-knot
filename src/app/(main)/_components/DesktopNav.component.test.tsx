import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { pathnameMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(() => "/"),
}));
vi.mock("next/navigation", () => ({ usePathname: pathnameMock }));

import {
  CATEGORY_NAV_ITEMS,
  GENERAL_NAV_ITEMS,
} from "@/core/domain/navigation";
import { DesktopNav } from "./DesktopNav";

const leafItem = GENERAL_NAV_ITEMS[0]!;
const groupItem = CATEGORY_NAV_ITEMS[0]!;

describe("DesktopNav", () => {
  it("서브카테고리 없는 항목은 바로 링크로 보여준다", () => {
    pathnameMock.mockReturnValue("/");
    render(<DesktopNav />);

    expect(screen.getByRole("link", { name: leafItem.label })).toHaveAttribute(
      "href",
      leafItem.href,
    );
  });

  it("서브카테고리 있는 항목은 트리거로 보여주고, 클릭하면 전체보기·서브카테고리 링크가 나타난다", async () => {
    pathnameMock.mockReturnValue("/");
    const user = userEvent.setup();
    render(<DesktopNav />);

    expect(
      screen.queryByRole("link", { name: groupItem.label }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: groupItem.label }));

    for (const sub of groupItem.submenu) {
      expect(screen.getByRole("link", { name: sub.label })).toHaveAttribute(
        "href",
        sub.href,
      );
    }
  });

  it("현재 경로와 일치하는 링크에 active 상태를 표시한다", () => {
    pathnameMock.mockReturnValue(leafItem.href);
    render(<DesktopNav />);

    expect(screen.getByRole("link", { name: leafItem.label })).toHaveAttribute(
      "data-active",
    );
  });
});
