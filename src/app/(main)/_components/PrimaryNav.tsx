"use client";

import { usePathname } from "next/navigation";
import {
  CATEGORY_NAV_ITEMS,
  GENERAL_NAV_ITEMS,
} from "@/core/domain/navigation";
import { CategoryNav } from "./CategoryNav";
import { GeneralNav } from "./GeneralNav";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/ui/components/atoms/navigation-menu";

const PrimaryNav = () => {
  const pathname = usePathname();

  return (
    <NavigationMenu className="hidden md:flex" viewport={false}>
      <NavigationMenuList aria-label="카테고리">
        <CategoryNav items={CATEGORY_NAV_ITEMS} pathname={pathname} />
        <GeneralNav items={GENERAL_NAV_ITEMS} pathname={pathname} />
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export { PrimaryNav };
