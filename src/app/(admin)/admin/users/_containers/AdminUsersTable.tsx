"use client";

import { Badge } from "@/ui/components/ui/badge";
import { TableCell, TableRow } from "@/ui/components/ui/table";
import { FilterSelect } from "@/ui/components/molecules/FilterSelect";
import { OffsetPagination } from "@/ui/components/molecules/OffsetPagination/OffsetPagination";
import { SearchInputBar } from "@/ui/components/molecules/SearchInputBar/SearchInputBar";
import { TableQueryState } from "@/ui/components/molecules/TableQueryState/TableQueryState";
import { DataTable } from "@/ui/components/organisms/DataTable";
import { ListPage } from "@/ui/components/templates/ListPage";
import { useOffsetList } from "@/ui/hooks/useOffsetList";
import type { AdminUserListItem, AdminUserSortKey } from "@/core/domain/user";
import {
  ADMIN_USER_SORT_KEYS,
  ADMIN_USER_STATUS_FILTERS,
  USER_ROLES,
} from "@/core/domain/user";
import { formatKstDate } from "@/core/utils/date";
import {
  ROLE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/app/(admin)/admin/users/_constants/filterOptions";
import { USER_ROLE_LABELS } from "@/app/(admin)/admin/users/_constants/labels";
import { USER_TABLE_COLUMNS } from "@/app/(admin)/admin/users/_constants/tableColumns";
import { UserActionsMenu } from "@/app/(admin)/admin/users/_components/UserActionsMenu";

const AdminUsersTable = () => {
  const table = useOffsetList<
    AdminUserListItem,
    AdminUserSortKey,
    { role: typeof USER_ROLES; status: typeof ADMIN_USER_STATUS_FILTERS }
  >({
    endpoint: "/api/admin/users",
    sortKeys: ADMIN_USER_SORT_KEYS,
    params: { role: USER_ROLES, status: ADMIN_USER_STATUS_FILTERS },
  });

  const refresh = () => {
    void table.mutate();
  };

  const items = table.items ?? [];
  const hasItems = items.length > 0;
  // TableQueryState는 오류를 먼저 판정하므로 두 곳에 같은 값을 넘겨도 된다.
  const isLoadingRows = !table.error && table.isLoading;
  const isRefreshing = !table.error && table.isValidating && hasItems;
  const emptyDescription = table.q
    ? "검색 결과가 없습니다"
    : "해당 역할의 사용자가 없습니다";
  // 첫 로딩·오류 중에는 건수를 모른다 — "총 0건"으로 보이지 않게 숨긴다.
  const pageInfo = table.error ? null : table.pageInfo;

  return (
    <ListPage title="사용자 관리">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap gap-4">
            <FilterSelect
              ariaLabel="역할 필터"
              allOptionLabel="전체 역할"
              options={ROLE_FILTER_OPTIONS}
              value={table.params.role}
              onValueChange={(value) => table.setParam("role", value)}
            />
            <FilterSelect
              ariaLabel="상태 필터"
              allOptionLabel="전체"
              options={STATUS_FILTER_OPTIONS}
              value={table.params.status}
              onValueChange={(value) => table.setParam("status", value)}
            />
          </div>
          <div className="w-full sm:max-w-sm">
            <SearchInputBar
              value={table.q}
              onSearch={table.setSearch}
              label="사용자 검색"
              placeholder="이름, 이메일"
            />
          </div>
        </div>

        <DataTable
          columns={USER_TABLE_COLUMNS}
          sortState={table.sortState}
          onSort={table.toggleSort}
          isLoading={isLoadingRows}
          isRefreshing={isRefreshing}
        >
          <TableQueryState
            columnsCount={USER_TABLE_COLUMNS.length}
            error={table.error}
            isLoading={isLoadingRows}
            hasItems={hasItems}
            emptyDescription={emptyDescription}
            onRetry={refresh}
          >
            {items.map((user) => (
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
            ))}
          </TableQueryState>
        </DataTable>

        {pageInfo && (
          <OffsetPagination
            page={table.page}
            totalPages={pageInfo.totalPages}
            total={pageInfo.total}
            onPageChange={table.setPage}
          />
        )}
      </div>
    </ListPage>
  );
};

export { AdminUsersTable };
