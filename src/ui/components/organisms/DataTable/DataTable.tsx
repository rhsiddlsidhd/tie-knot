"use client";

import type { ReactNode } from "react";

import type { SortState } from "@/core/utils/sort-cycle";

import { TableColumnHeader } from "@/ui/components/molecules/TableColumnHeader/TableColumnHeader";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from "@/ui/components/ui/table";

interface DataTableColumn<S extends string> {
  label: string;
  sort: S | null;
  className?: string;
}

interface DataTableProps<S extends string> {
  columns: readonly DataTableColumn<S>[];
  sortState: SortState<S>;
  onSort: (key: S) => void;
  // 오류 여부는 호출부가 이미 걸러서 넘긴다 — 골격은 오류 자체를 모른다.
  isLoading: boolean;
  isRefreshing: boolean;
  children: ReactNode;
}

const DataTable = <S extends string>({
  columns,
  sortState,
  onSort,
  isLoading,
  isRefreshing,
  children,
}: DataTableProps<S>) => (
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
      aria-label={isLoading ? "목록 불러오는 중" : "목록"}
      aria-busy={isLoading || isRefreshing ? "true" : undefined}
      className={isRefreshing ? "opacity-50" : undefined}
    >
      {children}
    </TableBody>
  </Table>
);

export { DataTable };
export type { DataTableColumn, DataTableProps };
