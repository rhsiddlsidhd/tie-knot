import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  Table,
  TableHeader,
  TableRow,
} from "@/ui/components/ui/table";
import { TableColumnHeader } from "./TableColumnHeader";

describe("TableColumnHeader", () => {
  it("정렬 키가 없으면 텍스트만 표시한다", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableColumnHeader
              label="상태"
              sortKey={null}
              sortState={null}
              onSort={vi.fn()}
            />
          </TableRow>
        </TableHeader>
      </Table>,
    );

    expect(screen.getByRole("columnheader", { name: "상태" })).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("활성 열의 오름차순 상태를 표시한다", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableColumnHeader
              label="가격"
              sortKey="price"
              sortState={{ key: "price", direction: "asc" }}
              onSort={vi.fn()}
            />
          </TableRow>
        </TableHeader>
      </Table>,
    );

    expect(screen.getByRole("columnheader", { name: "가격" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("다른 열이 정렬 중이면 aria-sort를 두지 않는다", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableColumnHeader
              label="가격"
              sortKey="price"
              sortState={{ key: "createdAt", direction: "desc" }}
              onSort={vi.fn()}
            />
          </TableRow>
        </TableHeader>
      </Table>,
    );

    expect(screen.getByRole("columnheader")).not.toHaveAttribute("aria-sort");
  });

  it("정렬 버튼을 누르면 열의 키를 전달한다", async () => {
    const onSort = vi.fn();
    const user = userEvent.setup();
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableColumnHeader
              label="가격"
              sortKey="price"
              sortState={null}
              onSort={onSort}
            />
          </TableRow>
        </TableHeader>
      </Table>,
    );

    await user.click(screen.getByRole("button", { name: "가격 정렬" }));

    expect(onSort).toHaveBeenCalledWith("price");
  });
});
