"use client";
import { ALL_NAVIGATE_ITEMS } from "@/core/domain/navigation";
import { cn } from "@/core/utils/cn";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/ui/components/atoms/button";
const SidebarNavItem = ({
  type,
}: {
  type: "ADMIN" | "MY_PROFILE" | "MY_ORDER";
}) => {
  const pathname = usePathname();
  const data = ALL_NAVIGATE_ITEMS[type];

  const [expandedMenus, setExpandedMenus] = useState<string[]>(() =>
    data.filter((item) => item.submenu).map((item) => item.label),
  );

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  return (
    <nav className="flex-1 overflow-y-auto">
      {data.map((item) => {
        const menuLabel = item.submenu ? item.label : null;

        return (
          <div key={item.label}>
            {menuLabel ? (
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleMenu(menuLabel)}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent/50 flex h-auto w-full items-center justify-between rounded-none px-6 py-3 text-sm transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedMenus.includes(menuLabel) && "rotate-180",
                    )}
                  />
                </Button>
                {expandedMenus.includes(menuLabel) && item.submenu && (
                  <div className="bg-accent/30">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "block py-2.5 pr-6 pl-14 text-sm transition-colors",
                          pathname === subItem.href
                            ? "text-primary bg-primary/10 font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                        )}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href ?? "#"}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 text-sm transition-colors",
                  pathname === item.href
                    ? "text-primary bg-primary/10 border-primary border-r-2 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                <span>{item.label}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export { SidebarNavItem };
