import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { TableCell, TableRow } from "@/ui/components/ui/table";
import { DataTable } from "./DataTable";

interface Item {
  id: string;
  name: string;
}

const columns = [{ label: "이름", sort: "name" as const }];
const items: Item[] = [{ id: "item-1", name: "청첩장" }];
const renderRow = (item: Item) => (
  <TableRow>
    <TableCell>{item.name}</TableCell>
  </TableRow>
);

const renderTable = (
  props: Partial<ComponentProps<typeof DataTable<Item, "name">>> = {},
) =>
  render(
    <DataTable
      columns={columns}
      items={items}
      getRowKey={(item) => item.id}
      renderRow={renderRow}
      onSort={vi.fn()}
      isLoading={false}
      isValidating={false}
      onRetry={vi.fn()}
      {...props}
    />,
  );

describe("DataTable", () => {
  it("오류가 다른 상태보다 우선하고 다시 시도할 수 있다", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderTable({
      error: { message: "목록을 불러오지 못했습니다" },
      isLoading: true,
      items: [],
      onRetry,
    });

    expect(screen.getByText("목록을 불러오지 못했습니다")).toBeVisible();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeVisible();
    expect(screen.queryByText("결과가 없습니다")).not.toBeInTheDocument();
    expect(screen.getByRole("rowgroup", { name: "목록" })).not.toHaveAttribute(
      "aria-busy",
    );

    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("로딩 중에는 열 수에 맞는 Skeleton 행을 표시한다", () => {
    renderTable({ items: undefined, isLoading: true });

    expect(screen.getByLabelText("목록 불러오는 중")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getAllByRole("cell")).toHaveLength(5);
  });

  it("항목이 없으면 기본 빈 결과 문구를 표시한다", () => {
    renderTable({ items: [] });

    expect(screen.getByText("결과가 없습니다")).toBeVisible();
  });

  it("항목이 있으면 renderRow 결과를 표시한다", () => {
    renderTable();

    expect(screen.getByRole("cell", { name: "청첩장" })).toBeVisible();
  });

  it("검색 결과가 비었으면 검색어를 반영한 문구를 표시한다", () => {
    renderTable({
      items: [],
      searchValue: "카드",
      onSearch: vi.fn(),
      searchLabel: "상품 검색",
      searchEmptyMessage: (query) => `'${query}' 검색 결과가 없습니다`,
    });

    expect(screen.getByText("'카드' 검색 결과가 없습니다")).toBeVisible();
  });

  it("재검증 중에는 이전 항목을 유지하고 body를 busy 상태로 표시한다", () => {
    renderTable({ isValidating: true });

    const body = screen.getByRole("rowgroup", { name: "목록" });
    expect(body).toHaveAttribute("aria-busy", "true");
    expect(body).toHaveClass("opacity-50");
    expect(screen.getByText("청첩장")).toBeVisible();
  });

  it("toolbar와 검색과 페이지네이션은 전달하지 않으면 숨긴다", () => {
    renderTable();

    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByText("필터 도구")).not.toBeInTheDocument();
  });

  it("toolbar와 검색과 페이지네이션을 전달하면 표시한다", () => {
    renderTable({
      toolbar: <button type="button">필터 도구</button>,
      searchValue: "",
      onSearch: vi.fn(),
      searchLabel: "상품 검색",
      page: 1,
      totalPages: 3,
      total: 25,
      onPageChange: vi.fn(),
    });

    expect(screen.getByRole("button", { name: "필터 도구" })).toBeVisible();
    expect(screen.getByRole("searchbox", { name: "상품 검색" })).toBeVisible();
    expect(screen.getByRole("navigation")).toBeVisible();
    expect(screen.getByText("총 25건")).toBeVisible();
  });
});
