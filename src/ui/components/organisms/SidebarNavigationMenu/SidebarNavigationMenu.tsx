"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type {
  NavigationGroup,
  NavigationLinkItem,
} from "@/core/domain/navigation";
import { NAVIGATION_BY_TYPE } from "@/core/domain/navigation";
import { cn } from "@/core/utils/cn";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/components/ui/popover";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/ui/components/ui/sidebar";

type NavigationEntry =
  | ({ kind: "group" } & NavigationGroup)
  | ({ kind: "link" } & NavigationLinkItem);

const buildSortedEntries = (
  groups: NavigationGroup[],
  links: NavigationLinkItem[],
): NavigationEntry[] =>
  [
    ...groups.map((group, index) => ({
      ...group,
      kind: "group" as const,
      order: group.order ?? index,
    })),
    ...links.map((link, index) => ({
      ...link,
      kind: "link" as const,
      order: link.order ?? groups.length + index,
    })),
  ].sort((a, b) => a.order - b.order);

const SidebarNavigationMenu = ({
  type,
  onNavigate,
}: {
  type: keyof typeof NAVIGATION_BY_TYPE;
  onNavigate?: () => void;
}) => {
  const pathname = usePathname();
  const { state, isMobile } = useSidebar();
  const { groups, links } = NAVIGATION_BY_TYPE[type];
  const [openGroupIds, setOpenGroupIds] = useState<Set<string>>(new Set());
  const isCollapsedRail = state === "collapsed" && !isMobile;

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

  const entries = buildSortedEntries(groups, links);

  return (
    <SidebarMenu className="gap-1 px-2 py-4">
      {entries.map((entry) => {
        if (entry.kind === "link") {
          const ItemIcon = entry.icon;

          return (
            <SidebarMenuItem key={entry.id}>
              <SidebarMenuButton
                asChild
                tooltip={entry.label}
                isActive={pathname === entry.href}
              >
                <Link href={entry.href} onClick={onNavigate}>
                  {ItemIcon ? <ItemIcon /> : null}
                  <span>{entry.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        }

        const GroupIcon = entry.icon;
        const isOpen = openGroupIds.has(entry.id);
        const groupButton = (
          <SidebarMenuButton
            type="button"
            tooltip={isCollapsedRail ? undefined : entry.label}
            aria-expanded={isCollapsedRail ? undefined : isOpen}
            onClick={
              isCollapsedRail ? undefined : () => toggleGroup(entry.id)
            }
          >
            {GroupIcon ? <GroupIcon /> : null}
            <span>{entry.label}</span>
            {!isCollapsedRail && (
              <ChevronRight
                className={cn(
                  "ml-auto transition-transform duration-200",
                  isOpen && "rotate-90",
                )}
              />
            )}
          </SidebarMenuButton>
        );

        if (isCollapsedRail) {
          return (
            <SidebarMenuItem key={entry.id}>
              <Popover>
                <PopoverTrigger asChild>{groupButton}</PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="start"
                  className="w-48 p-1"
                >
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {entry.label}
                  </p>
                  {entry.submenu.map((subItem) => (
                    <Link
                      key={subItem.id}
                      href={subItem.href}
                      onClick={onNavigate}
                      className={cn(
                        "block rounded-sm px-2 py-1.5 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        pathname === subItem.href &&
                          "bg-sidebar-accent text-sidebar-accent-foreground",
                      )}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </PopoverContent>
              </Popover>
            </SidebarMenuItem>
          );
        }

        return (
          <SidebarMenuItem key={entry.id}>
            {groupButton}
            {isOpen && (
              <SidebarMenuSub>
                {entry.submenu.map((subItem) => (
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
    </SidebarMenu>
  );
};

export { SidebarNavigationMenu };
