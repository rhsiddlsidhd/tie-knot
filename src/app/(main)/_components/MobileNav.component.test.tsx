import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MAIN_NAV_ITEMS } from "@/core/domain/navigation";
import { MobileNav } from "./MobileNav";

const leafItem = MAIN_NAV_ITEMS.find((item) => !item.submenu)!;
const groupItem = MAIN_NAV_ITEMS.find((item) => item.submenu)!;

describe("MobileNav", () => {
  it("로고는 홈으로 이동하는 링크다", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));

    expect(screen.getByRole("link", { name: "Tie Knot" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("메뉴 버튼 클릭 시 서브카테고리 없는 항목은 바로 링크로 보여준다", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));

    expect(
      screen.getByRole("link", { name: new RegExp(leafItem.label) }),
    ).toHaveAttribute("href", leafItem.href);
  });

  it("서브카테고리 있는 항목은 아코디언 트리거로 보여주고 펼치면 전체보기·서브카테고리 링크가 나타난다", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));

    expect(
      screen.queryByRole("link", { name: new RegExp(groupItem.label) }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: new RegExp(groupItem.label) }),
    );

    expect(screen.getByRole("link", { name: "전체보기" })).toHaveAttribute(
      "href",
      groupItem.href,
    );
    for (const sub of groupItem.submenu!) {
      expect(screen.getByRole("link", { name: sub.label })).toHaveAttribute(
        "href",
        sub.href,
      );
    }
  });

  it("닫기 버튼 클릭 시 메뉴가 닫힌다", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: "메뉴 열기" }));
    await user.click(screen.getByRole("button", { name: "메뉴 닫기" }));

    expect(
      screen.queryByRole("link", { name: new RegExp(leafItem.label) }),
    ).not.toBeInTheDocument();
  });
});
