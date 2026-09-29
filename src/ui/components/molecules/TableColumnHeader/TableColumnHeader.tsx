import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import type { SortDirection } from "@/core/utils/sort-cycle";
import { Button } from "@/ui/components/ui/button";
import { TableHead } from "@/ui/components/ui/table";

interface TableColumnHeaderProps<S extends string> {
  label: string;
  sortKey?: S;
  sort?: S;
  direction?: SortDirection;
  onSort: (key: S) => void;
  className?: string;
}

const TableColumnHeader = <S extends string>({
  label,
  sortKey,
  sort,
  direction,
  onSort,
  className,
}: TableColumnHeaderProps<S>) => {
  const isActive = sortKey !== undefined && sort === sortKey;
  const ariaSort = isActive
    ? direction === "asc"
      ? "ascending"
      : "descending"
    : undefined;

  return (
    <TableHead className={className} aria-sort={ariaSort}>
      {sortKey === undefined ? (
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
          {isActive && direction === "asc" ? (
            <ArrowUp aria-hidden="true" />
          ) : isActive ? (
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
