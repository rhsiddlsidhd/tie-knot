import type { ReactNode } from "react";
import { TableShell } from "@/ui/components/molecules/TableShell";
import { CursorPagination } from "@/ui/components/molecules/CursorPagination";

interface PaginatedTableProps {
  headings: string[];
  children: ReactNode;
  basePath: string;
  query?: Record<string, string>;
  hasCursor: boolean;
  nextCursor: string | null;
}

const PaginatedTable = ({
  headings,
  children,
  basePath,
  query,
  hasCursor,
  nextCursor,
}: PaginatedTableProps) => (
  <div className="space-y-4">
    <div className="bg-card overflow-hidden rounded-lg border">
      <TableShell headings={headings}>{children}</TableShell>
    </div>
    <CursorPagination
      basePath={basePath}
      query={query}
      hasCursor={hasCursor}
      nextCursor={nextCursor}
    />
  </div>
);

export { PaginatedTable };
