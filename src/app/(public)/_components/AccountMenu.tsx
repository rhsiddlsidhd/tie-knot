"use client";

import Link from "next/link";
import React from "react";
import { useAuth } from "@/ui/hooks/useAuth";
import { useLogout } from "../_hooks/useLogout";
import { Button } from "@/ui/components/atoms/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/atoms/dropdown-menu";

import { UserIcon, LogOut } from "lucide-react";
import {
  ADMIN_NAVIGATION_ITEMS,
  USER_NAVIGATION_ITEMS,
} from "@/core/domain/navigation";

const AccountMenu = () => {
  const { session } = useAuth();
  const { logout } = useLogout();

  const navigationItems =
    session?.role === "ADMIN"
      ? [...ADMIN_NAVIGATION_ITEMS, ...USER_NAVIGATION_ITEMS]
      : USER_NAVIGATION_ITEMS;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="사용자 메뉴">
          <UserIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {navigationItems.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href ?? "#"} className="flex w-full items-center">
              {item.icon && <item.icon className="mr-2 size-4" />}
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={logout}
          className="text-destructive focus:text-destructive flex w-full cursor-pointer items-center"
        >
          <LogOut className="mr-2 size-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { AccountMenu };
