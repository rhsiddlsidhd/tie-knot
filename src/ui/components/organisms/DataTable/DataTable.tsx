"use client";

import { Fragment } from "react";
import type { ReactNode } from "react";

import type { OffsetPageInfo } from "@/core/domain/offset";
import type { SortState } from "@/core/utils/sort-cycle";

import { OffsetPagination } from "@/ui/components/molecules/OffsetPagination/OffsetPagination";
import { SearchInputBar } from "@/ui/components/molecules/SearchInputBar/SearchInputBar";
import { TableColumnHeader } from "@/ui/components/molecules/TableColumnHeader/TableColumnHeader";
import { Button } from "@/ui/components/ui/button";
import { Empty, EmptyDescription } from "@/ui/components/ui/empty";
import { Skeleton } from "@/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/ui/components/ui/table";

interface DataTableColumn<S extends string> {
  label: string;
  sort: S | null;
  className?: string;
}

interface DataTableError {
  message: string;
}

interface DataTableSearch {
  value: string;
  onSearch: (value: string) => void;
  label: string;
  placeholder?: string;
}

interface DataTablePagination {
  page: number;
  onPageChange: (page: number) => void;
  pageInfo: OffsetPageInfo | null;
}

interface DataTableEmpty {
  default: string;
  search: string;
}

interface DataTableProps<T, S extends string> {
  columns: readonly DataTableColumn<S>[];
  items: T[] | undefined;
  getRowKey: (item: T) => string;
  renderRow: (item: T) => ReactNode;
  sortState: SortState<S>;
  onSort: (key: S) => void;
  search: DataTableSearch | null;
  pagination: DataTablePagination;
  isLoading: boolean;
  isValidating: boolean;
  error?: DataTableError;
  onRetry: () => void;
  empty: DataTableEmpty;
  toolbar?: ReactNode;
}

const DATA_TABLE_SKELETON_ROW_COUNT = 5;

const DataTable = <T, S extends string>({
  columns,
  items,
  getRowKey,
  renderRow,
  sortState,
  onSort,
  search,
  pagination,
  isLoading,
  isValidating,
  error,
  onRetry,
  empty,
  toolbar,
}: DataTableProps<T, S>) => {
  const visibleItems = items ?? [];
  const hasItems = visibleItems.length > 0;
  const isRefreshing = !error && isValidating && hasItems;
  const emptyDescription = search?.value ? empty.search : empty.default;
  // 첫 로딩·오류 중에는 건수를 모른다 — "총 0건"으로 보이지 않게 숨긴다.
  const pageInfo = error ? null : pagination.pageInfo;

  return (
    <div className="space-y-4">
      {(toolbar || search) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {toolbar && <div>{toolbar}</div>}
          {search && (
            <div className="w-full sm:max-w-sm">
              <SearchInputBar
                value={search.value}
                onSearch={search.onSearch}
                placeholder={search.placeholder}
                label={search.label}
              />
            </div>
          )}
        </div>
      )}

      <Table>
        <TableHeader className="bg-muted border-b">
          <TableRow>
            {columns.map((column, index) => (
              <TableColumnHeader
                key={index}
                label={column.label}
                sortKey={column.sort}
                sortState={sortState}
                onSort={onSort}
                className={column.className}
              />
            ))}
          </TableRow>
        </TableHeader>

        <TableBody
          aria-label={isLoading && !error ? "목록 불러오는 중" : "목록"}
          aria-busy={!error && (isLoading || isRefreshing) ? "true" : undefined}
          className={isRefreshing ? "opacity-50" : undefined}
        >
          {error ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Empty>
                  <EmptyDescription>{error.message}</EmptyDescription>
                  <Button type="button" variant="outline" onClick={onRetry}>
                    다시 시도
                  </Button>
                </Empty>
              </TableCell>
            </TableRow>
          ) : isLoading ? (
            Array.from({ length: DATA_TABLE_SKELETON_ROW_COUNT }, (_, row) => (
              <TableRow key={row}>
                {columns.map((_, index) => (
                  <TableCell key={index}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : !hasItems ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Empty>
                  <EmptyDescription>{emptyDescription}</EmptyDescription>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            visibleItems.map((item) => (
              <Fragment key={getRowKey(item)}>{renderRow(item)}</Fragment>
            ))
          )}
        </TableBody>
      </Table>

      {pageInfo && (
        <OffsetPagination
          page={pagination.page}
          totalPages={pageInfo.totalPages}
          total={pageInfo.total}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
};

export { DataTable };
export type {
  DataTableColumn,
  DataTableEmpty,
  DataTableError,
  DataTablePagination,
  DataTableProps,
  DataTableSearch,
};
