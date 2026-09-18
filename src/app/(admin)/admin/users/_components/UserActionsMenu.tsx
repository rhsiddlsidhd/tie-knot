"use client";

import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/ui/components/atoms/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/components/atoms/dropdown-menu";

const notifyPreparing = () =>
  toast.message("사용자 관리 기능은 준비 중입니다.");

const UserActionsMenu = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button size="sm" variant="ghost" aria-label="사용자 메뉴">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={notifyPreparing}>상세보기</DropdownMenuItem>
      <DropdownMenuItem onClick={notifyPreparing}>권한 변경</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export { UserActionsMenu };
