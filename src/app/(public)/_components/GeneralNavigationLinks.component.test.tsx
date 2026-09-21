import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import type { NavigationLinkItem } from "@/core/domain/navigation";
import { GeneralNavigationLinks } from "./GeneralNavigationLinks";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/ui/components/atoms/navigation-menu";

const items: NavigationLinkItem[] = [
  { id: "support", label: "고객 센터", href: "/support", icon: null },
];

const renderGeneralNavigationLinks = (pathname = "/") =>
  render(
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <GeneralNavigationLinks items={items} pathname={pathname} />
      </NavigationMenuList>
    </NavigationMenu>,
  );

describe("GeneralNavigationLinks", () => {
  it("항목을 href가 있는 링크로 바로 보여준다", () => {
    renderGeneralNavigationLinks();

    expect(screen.getByRole("link", { name: "고객 센터" })).toHaveAttribute(
      "href",
      "/support",
    );
  });

  it("현재 경로와 일치하는 링크에 active 상태를 표시한다", () => {
    renderGeneralNavigationLinks("/support");

    expect(screen.getByRole("link", { name: "고객 센터" })).toHaveAttribute(
      "data-active",
    );
  });
});
