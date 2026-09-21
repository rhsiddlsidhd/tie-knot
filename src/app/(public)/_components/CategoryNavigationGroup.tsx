import Link from "next/link";
import { cn } from "@/core/utils/cn";
import type { NavigationGroup } from "@/core/domain/navigation";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/ui/components/atoms/navigation-menu";

interface CategoryNavigationGroupProps {
  items: NavigationGroup[];
  pathname: string;
}

const CategoryNavigationGroup = ({
  items,
  pathname,
}: CategoryNavigationGroupProps) => {
  return items.map((item) => {
    const isActive = item.submenu.some((sub) => sub.href === pathname);

    return (
      <NavigationMenuItem key={item.id}>
        <NavigationMenuTrigger
          className={cn(
            "bg-transparent",
            isActive && "bg-accent/50 text-accent-foreground",
          )}
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

export { CategoryNavigationGroup };
