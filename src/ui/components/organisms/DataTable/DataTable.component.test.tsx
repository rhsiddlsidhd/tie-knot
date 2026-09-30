import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { TableCell, TableRow } from "@/ui/components/ui/table";
import { DataTable } from "./DataTable";

const columns = [{ label: "이름", sort: "name" as const }];

const renderTable = (
  props: Partial<ComponentProps<typeof DataTable<"name">>> = {},
) =>
  render(
    <DataTable
      columns={columns}
      sortState={null}
      onSort={vi.fn()}
      isLoading={false}
      isRefreshing={false}
      {...props}
    >
      <TableRow>
        <TableCell>청첩장</TableCell>
      </TableRow>
    </DataTable>,
  );

describe("DataTable", () => {
  it("children을 body에 그대로 배치한다", () => {
    renderTable();

    expect(screen.getByRole("cell", { name: "청첩장" })).toBeVisible();
    expect(screen.getByRole("rowgroup", { name: "목록" })).not.toHaveAttribute(
      "aria-busy",
    );
  });

  it("로딩 중에는 body를 불러오는 중으로 알린다", () => {
    renderTable({ isLoading: true });

    expect(screen.getByLabelText("목록 불러오는 중")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("재검증 중에는 body를 busy 상태로 흐리게 표시하고 children을 유지한다", () => {
    renderTable({ isRefreshing: true });

    const body = screen.getByRole("rowgroup", { name: "목록" });
    expect(body).toHaveAttribute("aria-busy", "true");
    expect(body).toHaveClass("opacity-50");
    expect(screen.getByText("청첩장")).toBeVisible();
  });

  it("정렬 키가 null인 열은 정렬 버튼 없이 표시하고 활성 열에 방향을 표시한다", () => {
    renderTable({
      columns: [
        { label: "이름", sort: "name" },
        { label: "메모", sort: null },
      ],
      sortState: { key: "name", direction: "desc" },
    });

    expect(screen.getByRole("button", { name: "이름 정렬" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "메모 정렬" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")[0]).toHaveAttribute(
      "aria-sort",
      "descending",
    );
  });

  it("같은 label의 열이 있어도 각 열을 렌더링한다", () => {
    renderTable({
      columns: [
        { label: "관리", sort: null },
        { label: "관리", sort: null },
      ],
    });

    expect(screen.getAllByRole("columnheader", { name: "관리" })).toHaveLength(
      2,
    );
  });
});
