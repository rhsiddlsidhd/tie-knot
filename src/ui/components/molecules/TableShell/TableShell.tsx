import type { ReactNode } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
} from "@/ui/components/atoms/table";

interface TableShellProps {
  headings: string[];
  children: ReactNode;
}

const TableShell = ({ headings, children }: TableShellProps) => (
    <Table>
      <TableHeader className="bg-muted border-b">
        <TableRow>
          {headings.map((heading) => (
            <TableHead
              key={heading}
              className="px-4 py-3 text-left text-sm font-semibold"
            >
              {heading}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </Table>
);

export { TableShell };
