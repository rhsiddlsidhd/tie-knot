"use client";

import { usePathname } from "next/navigation";
import {
  CATEGORY_NAV_ITEMS,
  GENERAL_NAV_ITEMS,
} from "@/core/domain/navigation";
import { CategoryNavigationGroup } from "./CategoryNavigationGroup";
import { GeneralNavigationLinks } from "./GeneralNavigationLinks";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/ui/components/atoms/navigation-menu";

const HeaderNavigationMenu = () => {
  const pathname = usePathname();

  return (
    <NavigationMenu className="hidden lg:flex" viewport={false}>
      <NavigationMenuList aria-label="카테고리">
        <CategoryNavigationGroup items={CATEGORY_NAV_ITEMS} pathname={pathname} />
        <GeneralNavigationLinks items={GENERAL_NAV_ITEMS} pathname={pathname} />
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export { HeaderNavigationMenu };
