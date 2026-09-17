import Link from "next/link";
import type { NavLinkItem } from "@/core/domain/navigation";
import {
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/ui/components/atoms/navigation-menu";

interface GeneralNavProps {
  items: NavLinkItem[];
  pathname: string;
}

const GeneralNav = ({ items, pathname }: GeneralNavProps) => {
  return items.map((item) => (
    <NavigationMenuItem key={item.id}>
      <NavigationMenuLink
        asChild
        active={pathname === item.href}
        className={navigationMenuTriggerStyle()}
      >
        <Link href={item.href}>{item.label}</Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  ));
};

export { GeneralNav };
