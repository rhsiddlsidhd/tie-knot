import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { NavGroupItem } from "@/core/domain/navigation";
import { CategoryNav } from "./CategoryNav";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/ui/components/atoms/navigation-menu";

const items: NavGroupItem[] = [
  {
    id: "mobile-invitation",
    label: "모바일초대장",
    icon: null,
    submenu: [
      {
        id: "mobile-invitation-all",
        label: "전체보기",
        href: "/products/mobile-invitation",
        icon: null,
      },
      {
        id: "wedding",
        label: "청첩장",
        href: "/products/mobile-invitation/wedding",
        icon: null,
      },
    ],
  },
];

const renderCategoryNav = (pathname = "/") =>
  render(
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <CategoryNav items={items} pathname={pathname} />
      </NavigationMenuList>
    </NavigationMenu>,
  );

describe("CategoryNav", () => {
  it("카테고리 트리거만 보이고 서브메뉴 링크는 숨겨져 있다", () => {
    renderCategoryNav();

    expect(
      screen.getByRole("button", { name: "모바일초대장" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "전체보기" }),
    ).not.toBeInTheDocument();
  });

  it("트리거를 클릭하면 전체보기·서브카테고리 링크가 나타난다", async () => {
    const user = userEvent.setup();
    renderCategoryNav();

    await user.click(screen.getByRole("button", { name: "모바일초대장" }));

    expect(screen.getByRole("link", { name: "전체보기" })).toHaveAttribute(
      "href",
      "/products/mobile-invitation",
    );
    expect(screen.getByRole("link", { name: "청첩장" })).toHaveAttribute(
      "href",
      "/products/mobile-invitation/wedding",
    );
  });
});
