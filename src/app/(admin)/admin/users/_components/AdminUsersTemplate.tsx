"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TypographyH1,
  TypographyMuted,
} from "@/ui/components/atoms";
import type { UserRole } from "@/core/domain";
import { MOCK_USERS, USER_ROLE_LABELS } from "../_constants";

const ROLE_FILTER_OPTIONS: Array<{ value: UserRole | "ALL"; label: string }> = [
  { value: "ALL", label: "전체 역할" },
  { value: "USER", label: USER_ROLE_LABELS.USER },
  { value: "ADMIN", label: USER_ROLE_LABELS.ADMIN },
];

const notifyPreparing = () =>
  toast.message("사용자 관리 기능은 준비 중입니다.");

const AdminUsersTemplate = () => {
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");

  const users =
    roleFilter === "ALL"
      ? MOCK_USERS
      : MOCK_USERS.filter((user) => user.role === roleFilter);

  return (
    <div className="space-y-6">
      <TypographyMuted>
        mock UI만 구현 — 실제 사용자 전체조회 API는 아직 없습니다.
      </TypographyMuted>

      <div className="flex items-center justify-between">
        <TypographyH1 className="text-left text-3xl font-bold">
          사용자 관리
        </TypographyH1>

        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value as UserRole | "ALL")}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">이름</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">이메일</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">가입일</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">역할</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">상태</th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.email} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm">{user.name}</td>
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3 text-sm">{user.joinedAt}</td>
                  <td className="px-4 py-3 text-sm">{USER_ROLE_LABELS[user.role]}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isDelete ? "secondary" : "default"}>
                      {user.isDelete ? "탈퇴" : "활동중"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" aria-label="사용자 메뉴">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={notifyPreparing}>
                          상세보기
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={notifyPreparing}>
                          권한 변경
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="flex flex-col items-center gap-1 py-16 text-center">
            <p className="text-sm font-medium">해당 역할의 사용자가 없습니다</p>
            <TypographyMuted>다른 역할 필터를 선택해보세요.</TypographyMuted>
          </div>
        )}
      </div>
    </div>
  );
};

export { AdminUsersTemplate };
