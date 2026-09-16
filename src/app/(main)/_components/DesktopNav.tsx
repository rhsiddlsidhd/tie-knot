"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV_ITEMS } from "@/core/domain/navigation";
import { cn } from "@/core/utils/cn";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/ui/components/atoms/navigation-menu";

const DesktopNav = () => {
  const pathname = usePathname();

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList aria-label="카테고리">
        {MAIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          if (!item.submenu) {
            return (
              <NavigationMenuItem key={item.id}>
                <NavigationMenuLink
                  asChild
                  active={isActive}
                  className={navigationMenuTriggerStyle()}
                >
                  <Link href={item.href}>{item.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          }

          return (
            <NavigationMenuItem key={item.id}>
              <NavigationMenuTrigger
                className={cn(isActive && "bg-accent/50 text-accent-foreground")}
              >
                {item.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-56 gap-1 p-2">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href={item.href} className="font-medium">
                        전체보기
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  {item.submenu.map((sub) => (
                    <li key={sub.id}>
                      <NavigationMenuLink asChild>
                        <Link href={sub.href}>{sub.label}</Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export { DesktopNav };
