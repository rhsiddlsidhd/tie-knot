"use client";

import { Badge } from "@/ui/components/ui/badge";
import { TableCell, TableRow } from "@/ui/components/ui/table";
import { FilterToggleGroup } from "@/ui/components/molecules/FilterToggleGroup";
import { DataTable } from "@/ui/components/organisms/DataTable";
import { ListPage } from "@/ui/components/templates/ListPage";
import { useOffsetList } from "@/ui/hooks/useOffsetList";
import type { AdminUserListItem, AdminUserSortKey } from "@/core/domain/user";
import { formatKstDate } from "@/core/utils/date";
import { ROLE_FILTER_OPTIONS } from "@/app/(admin)/admin/users/_constants/filterOptions";
import { USER_ROLE_LABELS } from "@/app/(admin)/admin/users/_constants/labels";
import { USER_TABLE_COLUMNS } from "@/app/(admin)/admin/users/_constants/tableColumns";
import { UserActionsMenu } from "@/app/(admin)/admin/users/_components/UserActionsMenu";

const AdminUsersTable = () => {
  const table = useOffsetList<AdminUserListItem, AdminUserSortKey, "role">({
    endpoint: "/api/admin/users",
    params: ["role"],
  });

  return (
    <ListPage title="사용자 관리">
      <DataTable
        columns={USER_TABLE_COLUMNS}
        items={table.items}
        getRowKey={(user) => user.id}
        renderRow={(user) => (
          <TableRow>
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
        )}
        toolbar={
          <FilterToggleGroup
            label="역할 필터"
            options={ROLE_FILTER_OPTIONS}
            value={table.params.role ?? "ALL"}
            onValueChange={(value) =>
              table.setParam("role", value === "ALL" ? undefined : value)
            }
          />
        }
        sortState={table.sortState}
        onSort={table.toggleSort}
        search={{
          value: table.q,
          onSearch: table.setSearch,
          label: "사용자 검색",
          placeholder: "이름, 이메일",
        }}
        pagination={{
          page: table.page,
          onPageChange: table.setPage,
          pageInfo: table.pageInfo,
        }}
        isLoading={table.isLoading}
        isValidating={table.isValidating}
        error={table.error}
        onRetry={() => void table.mutate()}
        empty={{
          default: "해당 역할의 사용자가 없습니다",
          search: "검색 결과가 없습니다",
        }}
      />
    </ListPage>
  );
};

export { AdminUsersTable };
