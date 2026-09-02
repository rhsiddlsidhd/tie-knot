"use client";

import { useRouter, usePathname } from "next/navigation";
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
import { CursorPagination } from "@/ui/components/molecules";
import type { AdminUserListPage, UserRole } from "@/core/domain/user";
import { formatKstDate } from "@/core/utils/date";
import { USER_ROLE_LABELS } from "../_constants";

const ROLE_FILTER_OPTIONS: Array<{ value: UserRole | "ALL"; label: string }> = [
  { value: "ALL", label: "전체 역할" },
  { value: "USER", label: USER_ROLE_LABELS.USER },
  { value: "ADMIN", label: USER_ROLE_LABELS.ADMIN },
];

const notifyPreparing = () =>
  toast.message("사용자 관리 기능은 준비 중입니다.");

interface AdminUsersTemplateProps {
  page: AdminUserListPage;
  role?: UserRole;
  cursor?: string;
}

const AdminUsersTemplate = ({ page, role, cursor }: AdminUsersTemplateProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleRoleChange = (value: UserRole | "ALL") => {
    const query = value === "ALL" ? "" : `?role=${value}`;
    router.push(`${pathname}${query}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <TypographyH1 className="text-left text-3xl font-bold">
          사용자 관리
        </TypographyH1>

        <Select value={role ?? "ALL"} onValueChange={handleRoleChange}>
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
              {page.items.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm">{user.name}</td>
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3 text-sm">
                    {formatKstDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm">{USER_ROLE_LABELS[user.role]}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.deletedAt ? "secondary" : "default"}>
                      {user.deletedAt ? "탈퇴" : "활동중"}
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

        {page.items.length === 0 && (
          <div className="flex flex-col items-center gap-1 py-16 text-center">
            <p className="text-sm font-medium">해당 역할의 사용자가 없습니다</p>
            <TypographyMuted>다른 역할 필터를 선택해보세요.</TypographyMuted>
          </div>
        )}
      </div>

      <CursorPagination
        basePath={pathname}
        query={role ? { role } : {}}
        hasCursor={!!cursor}
        nextCursor={page.nextCursor}
      />
    </div>
  );
};

export { AdminUsersTemplate };
