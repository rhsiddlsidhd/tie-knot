"use client";

import { Badge } from "@/ui/components/ui/badge";
import { TableCell, TableRow } from "@/ui/components/ui/table";
import { FilterSelect } from "@/ui/components/molecules/FilterSelect";
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

  return (
    <ListPage title="주문 관리">
      <DataTable
        columns={ORDER_TABLE_COLUMNS}
        items={table.items}
        getRowKey={(order) => order.id}
        renderRow={(order) => (
          <TableRow>
            <TableCell>{order.merchantUid}</TableCell>
            <TableCell>{order.buyerName}</TableCell>
            <TableCell>{order.productTitle}</TableCell>
            <TableCell>
              <Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.orderStatus]}>
                {ORDER_STATUS_LABELS[order.orderStatus]}
              </Badge>
            </TableCell>
            <TableCell className="font-semibold">
              {order.finalPrice.toLocaleString()}원
            </TableCell>
            <TableCell>{formatKstDate(order.createdAt)}</TableCell>
          </TableRow>
        )}
        toolbar={
          <FilterSelect
            ariaLabel="주문 상태 필터"
            allOptionLabel="전체 상태"
            options={STATUS_FILTER_OPTIONS}
            value={table.params.status}
            onValueChange={(value) => table.setParam("status", value)}
          />
        }
        sortState={table.sortState}
        onSort={table.toggleSort}
        search={{
          value: table.q,
          onSearch: table.setSearch,
          label: "주문 검색",
          placeholder: "주문번호, 고객명, 이메일, 전화번호",
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
          default: "조건에 해당하는 주문이 없습니다",
          search: "검색 결과가 없습니다",
        }}
      />
    </ListPage>
  );
};

export { AdminOrdersTable };
