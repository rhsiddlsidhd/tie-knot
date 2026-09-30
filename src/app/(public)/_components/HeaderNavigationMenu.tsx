"use client";

import { usePathname } from "next/navigation";
import {
  GENERAL_NAVIGATION_ITEMS,
  type NavigationGroup,
} from "@/core/domain/navigation";
import { CategoryNavigationGroup } from "./CategoryNavigationGroup";
import { GeneralNavigationLinks } from "./GeneralNavigationLinks";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/ui/components/ui/navigation-menu";

const HeaderNavigationMenu = ({ items }: { items: NavigationGroup[] }) => {
  const pathname = usePathname();

  return (
    <NavigationMenu className="hidden lg:flex" viewport={false}>
      <NavigationMenuList aria-label="카테고리">
        <CategoryNavigationGroup items={items} pathname={pathname} />
        <GeneralNavigationLinks
          items={GENERAL_NAVIGATION_ITEMS}
          pathname={pathname}
        />
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export { HeaderNavigationMenu };
