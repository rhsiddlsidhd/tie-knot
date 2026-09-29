"use client";

import { Fragment } from "react";
import type { ReactNode } from "react";

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

type DataTableSortDirection = "asc" | "desc";

interface DataTableColumn<S extends string> {
  label: string;
  sort?: S;
  className?: string;
}

interface DataTableError {
  message: string;
}

interface DataTableProps<T, S extends string> {
  columns: readonly DataTableColumn<S>[];
  items: T[] | undefined;
  getRowKey: (item: T) => string;
  renderRow: (item: T) => ReactNode;
  sort?: S;
  direction?: DataTableSortDirection;
  onSort: (key: S) => void;
  searchValue?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  isLoading: boolean;
  isValidating: boolean;
  error?: DataTableError;
  onRetry: () => void;
  emptyMessage?: string;
  searchEmptyMessage?: string | ((query: string) => string);
  toolbar?: ReactNode;
}

const DATA_TABLE_SKELETON_ROW_COUNT = 5;

const DataTable = <T, S extends string>({
  columns,
  items,
  getRowKey,
  renderRow,
  sort,
  direction,
  onSort,
  searchValue = "",
  onSearch,
  searchPlaceholder,
  searchLabel = "목록 검색",
  page,
  totalPages,
  total,
  onPageChange,
  isLoading,
  isValidating,
  error,
  onRetry,
  emptyMessage = "결과가 없습니다",
  searchEmptyMessage,
  toolbar,
}: DataTableProps<T, S>) => {
  const visibleItems = items ?? [];
  const hasItems = visibleItems.length > 0;
  const isRefreshing = !error && isValidating && hasItems;
  const emptyDescription =
    searchValue && searchEmptyMessage
      ? typeof searchEmptyMessage === "function"
        ? searchEmptyMessage(searchValue)
        : searchEmptyMessage
      : emptyMessage;
  const showPagination =
    page !== undefined &&
    totalPages !== undefined &&
    total !== undefined &&
    onPageChange !== undefined;

  return (
    <div className="space-y-4">
      {(toolbar || onSearch) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {toolbar && <div>{toolbar}</div>}
          {onSearch && (
            <div className="w-full sm:max-w-sm">
              <SearchInputBar
                value={searchValue}
                onSearch={onSearch}
                placeholder={searchPlaceholder}
                label={searchLabel}
              />
            </div>
          )}
        </div>
      )}

      <Table>
        <TableHeader className="bg-muted border-b">
          <TableRow>
            {columns.map((column) => (
              <TableColumnHeader
                key={column.label}
                label={column.label}
                sortKey={column.sort}
                sort={sort}
                direction={direction}
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
                {columns.map((column) => (
                  <TableCell key={column.label}>
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

      {showPagination && (
        <OffsetPagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export { DataTable };
export type {
  DataTableColumn,
  DataTableError,
  DataTableProps,
  DataTableSortDirection,
};
