import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import type { SortState } from "@/core/utils/sort-cycle";
import { Button } from "@/ui/components/ui/button";
import { TableHead } from "@/ui/components/ui/table";

interface TableColumnHeaderProps<S extends string> {
  label: string;
  sortKey: S | null;
  sortState: SortState<S>;
  onSort: (key: S) => void;
  className?: string;
}

const TableColumnHeader = <S extends string>({
  label,
  sortKey,
  sortState,
  onSort,
  className,
}: TableColumnHeaderProps<S>) => {
  const activeDirection =
    sortKey !== null && sortState?.key === sortKey ? sortState.direction : null;
  const ariaSort =
    activeDirection === "asc"
      ? "ascending"
      : activeDirection === "desc"
        ? "descending"
        : undefined;

  return (
    <TableHead className={className} aria-sort={ariaSort}>
      {sortKey === null ? (
        label
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-3"
          aria-label={`${label} 정렬`}
          onClick={() => onSort(sortKey)}
        >
          {label}
          {activeDirection === "asc" ? (
            <ArrowUp aria-hidden="true" />
          ) : activeDirection === "desc" ? (
            <ArrowDown aria-hidden="true" />
          ) : (
            <ArrowUpDown aria-hidden="true" />
          )}
        </Button>
      )}
    </TableHead>
  );
};

export { TableColumnHeader };
export type { TableColumnHeaderProps };
