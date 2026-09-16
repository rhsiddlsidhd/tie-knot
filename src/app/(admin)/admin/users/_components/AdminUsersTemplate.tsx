import { Badge } from "@/ui/components/atoms/badge";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/ui/components/atoms/empty";
import { TableRow, TableCell } from "@/ui/components/atoms/table";
import { AdminListHeading } from "@/ui/components/molecules/AdminListHeading";
import { PaginatedTable } from "@/ui/components/organisms/PaginatedTable";
import { QueryFilterSelect } from "@/ui/components/organisms/QueryFilterSelect";
import { QuerySearchInput } from "@/ui/components/organisms/QuerySearchInput";
import type { AdminUserListPage, UserRole } from "@/core/domain/user";
import { formatKstDate } from "@/core/utils/date";
import { ROUTES } from "@/core/domain/routes";
import { USER_ROLE_LABELS } from "@/app/(admin)/admin/users/_constants/labels";
import { UserActionsMenu } from "./UserActionsMenu";

const TABLE_HEADINGS = ["이름", "이메일", "가입일", "역할", "상태", ""];

const ROLE_FILTER_OPTIONS: Array<{ value: UserRole | "ALL"; label: string }> = [
  { value: "ALL", label: "전체 역할" },
  { value: "USER", label: USER_ROLE_LABELS.USER },
  { value: "ADMIN", label: USER_ROLE_LABELS.ADMIN },
];

interface AdminUsersTemplateProps {
  page: AdminUserListPage;
  q?: string;
  role?: UserRole;
  cursor?: string;
}

const AdminUsersTemplate = ({
  page,
  q,
  role,
  cursor,
}: AdminUsersTemplateProps) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <AdminListHeading title="사용자 관리" />
      <QueryFilterSelect
        basePath={ROUTES.admin.users}
        paramName="role"
        value={role}
        options={ROLE_FILTER_OPTIONS}
        preserved={{ q }}
      />
    </div>

    <QuerySearchInput
      basePath={ROUTES.admin.users}
      label="사용자 검색"
      value={q}
      placeholder="이름, 이메일"
      preserved={{ role }}
    />

    <PaginatedTable
      headings={TABLE_HEADINGS}
      basePath={ROUTES.admin.users}
      query={{
        ...(role ? { role } : {}),
        ...(q ? { q } : {}),
      }}
      hasCursor={!!cursor}
      nextCursor={page.nextCursor}
    >
      {page.items.length === 0 ? (
        <TableRow>
          <TableCell colSpan={TABLE_HEADINGS.length}>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>
                  {q ? "검색 결과가 없습니다" : "해당 역할의 사용자가 없습니다"}
                </EmptyTitle>
                <EmptyDescription>
                  {q
                    ? "검색어를 지우면 전체 사용자를 볼 수 있습니다."
                    : "다른 역할 필터를 선택해보세요."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </TableCell>
        </TableRow>
      ) : (
        page.items.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{formatKstDate(user.createdAt)}</TableCell>
            <TableCell>{USER_ROLE_LABELS[user.role]}</TableCell>
            <TableCell>
              <Badge variant={user.deletedAt ? "secondary" : "default"}>
                {user.deletedAt ? "탈퇴" : "활동중"}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              <UserActionsMenu />
            </TableCell>
          </TableRow>
        ))
      )}
    </PaginatedTable>
  </div>
);

export { AdminUsersTemplate };
