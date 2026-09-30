"use client";

import type { ReactNode } from "react";

import { Button } from "@/ui/components/ui/button";
import { Empty, EmptyDescription } from "@/ui/components/ui/empty";
import { Skeleton } from "@/ui/components/ui/skeleton";
import { TableCell, TableRow } from "@/ui/components/ui/table";

interface TableQueryStateError {
  message: string;
}

interface TableQueryStateProps {
  columnsCount: number;
  error?: TableQueryStateError;
  isLoading: boolean;
  hasItems: boolean;
  emptyDescription: string;
  onRetry: () => void;
  children: ReactNode;
}

const TABLE_QUERY_STATE_SKELETON_ROW_COUNT = 5;

// `<TableBody>`의 직속 자식이라 `<TableRow>`나 Fragment만 반환한다 — `<div>`로 감싸면
// HTML이 무효가 되어 브라우저가 그 요소를 테이블 밖으로 끌어낸다. 그래서 오류·빈 상태도
// `colSpan`으로 한 행을 차지하며, 열 개수를 알아야 해서 `columnsCount`를 받는다.
const TableQueryState = ({
  columnsCount,
  error,
  isLoading,
  hasItems,
  emptyDescription,
  onRetry,
  children,
}: TableQueryStateProps) => {
  if (error) {
    return (
      <TableRow>
        <TableCell colSpan={columnsCount}>
          <Empty>
            <EmptyDescription>{error.message}</EmptyDescription>
            <Button type="button" variant="outline" onClick={onRetry}>
              다시 시도
            </Button>
          </Empty>
        </TableCell>
      </TableRow>
    );
  }

  if (isLoading) {
    return (
      <>
        {Array.from(
          { length: TABLE_QUERY_STATE_SKELETON_ROW_COUNT },
          (_, row) => (
            <TableRow key={row}>
              {Array.from({ length: columnsCount }, (_, column) => (
                <TableCell key={column}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ),
        )}
      </>
    );
  }

  if (!hasItems) {
    return (
      <TableRow>
        <TableCell colSpan={columnsCount}>
          <Empty>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </Empty>
        </TableCell>
      </TableRow>
    );
  }

  return <>{children}</>;
};

export { TableQueryState };
export type { TableQueryStateError, TableQueryStateProps };
