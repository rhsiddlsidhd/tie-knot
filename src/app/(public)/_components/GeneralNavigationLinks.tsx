import Link from "next/link";
import type { NavigationLinkItem } from "@/core/domain/navigation";
import {
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/ui/components/atoms/navigation-menu";

interface GeneralNavigationLinksProps {
  items: NavigationLinkItem[];
  pathname: string;
}

const GeneralNavigationLinks = ({
  items,
  pathname,
}: GeneralNavigationLinksProps) => {
  return items.map((item) => (
    <NavigationMenuItem key={item.id}>
      <NavigationMenuLink
        asChild
        active={pathname === item.href}
        className={navigationMenuTriggerStyle()}
      >
        <Link href={item.href} className="bg-transparent">
          {item.label}
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  ));
};

export { GeneralNavigationLinks };
