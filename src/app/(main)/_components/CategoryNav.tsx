import Link from "next/link";
import { cn } from "@/core/utils/cn";
import type { NavGroupItem } from "@/core/domain/navigation";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/ui/components/atoms/navigation-menu";

interface CategoryNavProps {
  items: NavGroupItem[];
  pathname: string;
}

const CategoryNav = ({ items, pathname }: CategoryNavProps) => {
  return items.map((item) => {
    const isActive = item.submenu.some((sub) => sub.href === pathname);

    return (
      <NavigationMenuItem key={item.id}>
        <NavigationMenuTrigger
          className={cn(isActive && "bg-accent/50 text-accent-foreground")}
        >
          {item.label}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-56 gap-1 p-2">
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
  });
};

export { CategoryNav };
