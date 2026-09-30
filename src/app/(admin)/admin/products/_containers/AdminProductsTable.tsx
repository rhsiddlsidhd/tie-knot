"use client";

import { FilterSelect } from "@/ui/components/molecules/FilterSelect";
import { OffsetPagination } from "@/ui/components/molecules/OffsetPagination/OffsetPagination";
import { SearchInputBar } from "@/ui/components/molecules/SearchInputBar/SearchInputBar";
import { TableQueryState } from "@/ui/components/molecules/TableQueryState/TableQueryState";
import { DataTable } from "@/ui/components/organisms/DataTable";
import { useOffsetList } from "@/ui/hooks/useOffsetList";
import type { AdminProductSortKey, Product } from "@/core/domain/product";
import {
  ADMIN_PRODUCT_SOFT_DELETED_VALUES,
  ADMIN_PRODUCT_SORT_KEYS,
  ADMIN_PRODUCT_TYPE_FILTERS,
  EDITABLE_PRODUCT_STATUSES,
} from "@/core/domain/product";
import { PRODUCT_EMPTY_MESSAGES } from "@/app/(admin)/admin/products/_constants/emptyMessages";
import {
  STATUS_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
} from "@/app/(admin)/admin/products/_constants/filterOptions";
import {
  ACTIVE_PRODUCT_TABLE_COLUMNS,
  TRASH_PRODUCT_TABLE_COLUMNS,
} from "@/app/(admin)/admin/products/_constants/tableColumns";
import { ProductTableRow } from "@/app/(admin)/admin/products/_components/ProductTableRow";

interface AdminProductsTableProps {
  isDelete: boolean;
}

const AdminProductsTable = ({ isDelete }: AdminProductsTableProps) => {
  const table = useOffsetList<
    Product,
    AdminProductSortKey,
    {
      softDeleted: typeof ADMIN_PRODUCT_SOFT_DELETED_VALUES;
      status: typeof EDITABLE_PRODUCT_STATUSES;
      type: typeof ADMIN_PRODUCT_TYPE_FILTERS;
    }
  >({
    endpoint: "/api/admin/products",
    sortKeys: ADMIN_PRODUCT_SORT_KEYS,
    params: {
      softDeleted: ADMIN_PRODUCT_SOFT_DELETED_VALUES,
      status: EDITABLE_PRODUCT_STATUSES,
      type: ADMIN_PRODUCT_TYPE_FILTERS,
    },
  });

  const refresh = () => {
    void table.mutate();
  };

  const columns = isDelete
    ? TRASH_PRODUCT_TABLE_COLUMNS
    : ACTIVE_PRODUCT_TABLE_COLUMNS;
  const items = table.items ?? [];
  const hasItems = items.length > 0;
  // TableQueryState는 오류를 먼저 판정하므로 두 곳에 같은 값을 넘겨도 된다.
  const isLoadingRows = !table.error && table.isLoading;
  const isRefreshing = !table.error && table.isValidating && hasItems;
  const emptyDescription = table.q
    ? PRODUCT_EMPTY_MESSAGES.search
    : isDelete
      ? PRODUCT_EMPTY_MESSAGES.trash
      : PRODUCT_EMPTY_MESSAGES.active;
  // 첫 로딩·오류 중에는 건수를 모른다 — "총 0건"으로 보이지 않게 숨긴다.
  const pageInfo = table.error ? null : table.pageInfo;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-4">
          {!isDelete && (
            <FilterSelect
              ariaLabel="상태 필터"
              allOptionLabel="전체 상태"
              options={STATUS_FILTER_OPTIONS}
              value={table.params.status}
              onValueChange={(value) => table.setParam("status", value)}
            />
          )}
          {!isDelete && (
            <FilterSelect
              ariaLabel="타입 필터"
              allOptionLabel="전체 타입"
              options={TYPE_FILTER_OPTIONS}
              value={table.params.type}
              onValueChange={(value) => table.setParam("type", value)}
            />
          )}
        </div>
        <div className="w-full sm:max-w-sm">
          <SearchInputBar
            value={table.q}
            onSearch={table.setSearch}
            label="상품 검색"
            placeholder="상품명, 카테고리"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        sortState={table.sortState}
        onSort={table.toggleSort}
        isLoading={isLoadingRows}
        isRefreshing={isRefreshing}
      >
        <TableQueryState
          columnsCount={columns.length}
          error={table.error}
          isLoading={isLoadingRows}
          hasItems={hasItems}
          emptyDescription={emptyDescription}
          onRetry={refresh}
        >
          {items.map((product) => (
            <ProductTableRow
              key={product._id}
              product={product}
              softDeleted={isDelete}
              onRefreshed={refresh}
            />
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
  );
};

export { AdminProductsTable };
export type { AdminProductsTableProps };
