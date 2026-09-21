"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { NAVIGATION_BY_TYPE } from "@/core/domain/navigation";
import { cn } from "@/core/utils/cn";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/ui/components/atoms/sidebar";

const SidebarNavMenu = ({
  type,
  onNavigate,
}: {
  type: keyof typeof NAVIGATION_BY_TYPE;
  onNavigate?: () => void;
}) => {
  const pathname = usePathname();
  const { groups, links } = NAVIGATION_BY_TYPE[type];
  const [openGroupIds, setOpenGroupIds] = useState<Set<string>>(new Set());

  const toggleGroup = (id: string) => {
    setOpenGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <SidebarMenu className="gap-1 px-2 py-4">
      {groups.map((group) => {
        const GroupIcon = group.icon;
        const isOpen = openGroupIds.has(group.id);

        return (
          <SidebarMenuItem key={group.id}>
            <SidebarMenuButton
              type="button"
              tooltip={group.label}
              aria-expanded={isOpen}
              onClick={() => toggleGroup(group.id)}
            >
              {GroupIcon ? <GroupIcon /> : null}
              <span>{group.label}</span>
              <ChevronRight
                className={cn(
                  "ml-auto transition-transform duration-200",
                  isOpen && "rotate-90",
                )}
              />
            </SidebarMenuButton>
            {isOpen && (
              <SidebarMenuSub>
                {group.submenu.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.id}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={pathname === subItem.href}
                    >
                      <Link href={subItem.href} onClick={onNavigate}>
                        {subItem.label}
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        );
      })}
      {links.map((item) => {
        const ItemIcon = item.icon;

        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              asChild
              tooltip={item.label}
              isActive={pathname === item.href}
            >
              <Link href={item.href} onClick={onNavigate}>
                {ItemIcon ? <ItemIcon /> : null}
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
};

export { SidebarNavMenu };
