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
import type {
  AdminOrderListItem,
  AdminOrderSortKey,
} from "@/core/domain/order";
import {
  ADMIN_ORDER_SORT_KEYS,
  ORDER_STATUS_BADGE_VARIANTS,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
} from "@/core/domain/order";
import { formatKstDate } from "@/core/utils/date";
import { STATUS_FILTER_OPTIONS } from "@/app/(admin)/admin/orders/_constants/filterOptions";
import { ORDER_TABLE_COLUMNS } from "@/app/(admin)/admin/orders/_constants/tableColumns";

const AdminOrdersTable = () => {
  const table = useOffsetList<
    AdminOrderListItem,
    AdminOrderSortKey,
    { status: typeof ORDER_STATUSES }
  >({
    endpoint: "/api/admin/orders",
    sortKeys: ADMIN_ORDER_SORT_KEYS,
    params: { status: ORDER_STATUSES },
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
    : "조건에 해당하는 주문이 없습니다";
  // 첫 로딩·오류 중에는 건수를 모른다 — "총 0건"으로 보이지 않게 숨긴다.
  const pageInfo = table.error ? null : table.pageInfo;

  return (
    <ListPage title="주문 관리">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <FilterSelect
            ariaLabel="주문 상태 필터"
            allOptionLabel="전체 상태"
            options={STATUS_FILTER_OPTIONS}
            value={table.params.status}
            onValueChange={(value) => table.setParam("status", value)}
          />
          <div className="w-full sm:max-w-sm">
            <SearchInputBar
              value={table.q}
              onSearch={table.setSearch}
              label="주문 검색"
              placeholder="주문번호, 고객명, 이메일, 전화번호"
            />
          </div>
        </div>

        <DataTable
          columns={ORDER_TABLE_COLUMNS}
          sortState={table.sortState}
          onSort={table.toggleSort}
          isLoading={isLoadingRows}
          isRefreshing={isRefreshing}
        >
          <TableQueryState
            columnsCount={ORDER_TABLE_COLUMNS.length}
            error={table.error}
            isLoading={isLoadingRows}
            hasItems={hasItems}
            emptyDescription={emptyDescription}
            onRetry={refresh}
          >
            {items.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.merchantUid}</TableCell>
                <TableCell>{order.buyerName}</TableCell>
                <TableCell>{order.productTitle}</TableCell>
                <TableCell>
                  <Badge
                    variant={ORDER_STATUS_BADGE_VARIANTS[order.orderStatus]}
                  >
                    {ORDER_STATUS_LABELS[order.orderStatus]}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold">
                  {order.finalPrice.toLocaleString()}원
                </TableCell>
                <TableCell>{formatKstDate(order.createdAt)}</TableCell>
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

export { AdminOrdersTable };
