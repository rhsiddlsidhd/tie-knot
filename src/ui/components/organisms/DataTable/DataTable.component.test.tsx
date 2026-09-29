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
      sortState={null}
      onSort={vi.fn()}
      search={null}
      pagination={{ page: 1, onPageChange: vi.fn(), pageInfo: null }}
      isLoading={false}
      isValidating={false}
      onRetry={vi.fn()}
      empty={{
        default: "등록된 항목이 없습니다",
        search: "검색 결과가 없습니다",
      }}
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
    expect(
      screen.queryByText("등록된 항목이 없습니다"),
    ).not.toBeInTheDocument();
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

    expect(screen.getByText("등록된 항목이 없습니다")).toBeVisible();
  });

  it("항목이 있으면 renderRow 결과를 표시한다", () => {
    renderTable();

    expect(screen.getByRole("cell", { name: "청첩장" })).toBeVisible();
  });

  it("검색어가 있는데 결과가 비었으면 검색 빈 결과 문구를 표시한다", () => {
    renderTable({
      items: [],
      search: { value: "카드", onSearch: vi.fn(), label: "상품 검색" },
    });

    expect(screen.getByText("검색 결과가 없습니다")).toBeVisible();
    expect(
      screen.queryByText("등록된 항목이 없습니다"),
    ).not.toBeInTheDocument();
  });

  it("검색어가 비어 있으면 기본 빈 결과 문구를 표시한다", () => {
    renderTable({
      items: [],
      search: { value: "", onSearch: vi.fn(), label: "상품 검색" },
    });

    expect(screen.getByText("등록된 항목이 없습니다")).toBeVisible();
  });

  it("재검증 중에는 이전 항목을 유지하고 body를 busy 상태로 표시한다", () => {
    renderTable({ isValidating: true });

    const body = screen.getByRole("rowgroup", { name: "목록" });
    expect(body).toHaveAttribute("aria-busy", "true");
    expect(body).toHaveClass("opacity-50");
    expect(screen.getByText("청첩장")).toBeVisible();
  });

  it("toolbar와 검색은 전달하지 않으면 숨기고 pageInfo가 없으면 페이지네이션을 숨긴다", () => {
    renderTable();

    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByText(/^총 /)).not.toBeInTheDocument();
    expect(screen.queryByText("필터 도구")).not.toBeInTheDocument();
  });

  it("toolbar와 검색과 페이지 정보를 전달하면 표시한다", () => {
    renderTable({
      toolbar: <button type="button">필터 도구</button>,
      search: {
        value: "",
        onSearch: vi.fn(),
        label: "상품 검색",
        placeholder: "상품명",
      },
      pagination: {
        page: 1,
        onPageChange: vi.fn(),
        pageInfo: { total: 25, totalPages: 3 },
      },
    });

    expect(screen.getByRole("button", { name: "필터 도구" })).toBeVisible();
    expect(screen.getByRole("searchbox", { name: "상품 검색" })).toBeVisible();
    expect(screen.getByRole("navigation")).toBeVisible();
    expect(screen.getByText("총 25건")).toBeVisible();
  });

  it("오류가 있으면 이전 페이지 정보가 있어도 총 건수와 페이지를 숨긴다", () => {
    renderTable({
      error: { message: "목록을 불러오지 못했습니다" },
      pagination: {
        page: 1,
        onPageChange: vi.fn(),
        pageInfo: { total: 25, totalPages: 3 },
      },
    });

    expect(screen.queryByText("총 25건")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
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
    render(
      <DataTable
        columns={[
          { label: "관리", sort: null },
          { label: "관리", sort: null },
        ]}
        items={[]}
        getRowKey={(item: Item) => item.id}
        renderRow={renderRow}
        sortState={null}
        onSort={vi.fn()}
        search={null}
        pagination={{ page: 1, onPageChange: vi.fn(), pageInfo: null }}
        isLoading={false}
        isValidating={false}
        onRetry={vi.fn()}
        empty={{ default: "없음", search: "검색 없음" }}
      />,
    );

    expect(screen.getAllByRole("columnheader", { name: "관리" })).toHaveLength(
      2,
    );
  });
});
