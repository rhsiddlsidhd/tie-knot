import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/ui/components/ui/table";
import { TableQueryState } from "./TableQueryState";

const renderState = (
  props: Partial<ComponentProps<typeof TableQueryState>> = {},
) =>
  render(
    <Table>
      <TableBody>
        <TableQueryState
          columnsCount={5}
          isLoading={false}
          hasItems
          emptyDescription="등록된 항목이 없습니다"
          onRetry={vi.fn()}
          {...props}
        >
          <TableRow>
            <TableCell>청첩장</TableCell>
          </TableRow>
        </TableQueryState>
      </TableBody>
    </Table>,
  );

describe("TableQueryState", () => {
  it("오류가 로딩·빈 상태보다 우선하고 다시 시도할 수 있다", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderState({
      error: { message: "목록을 불러오지 못했습니다" },
      isLoading: true,
      hasItems: false,
      onRetry,
    });

    expect(screen.getByText("목록을 불러오지 못했습니다")).toBeVisible();
    expect(
      screen.queryByText("등록된 항목이 없습니다"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("청첩장")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("로딩 중에는 열 수에 맞는 Skeleton 행을 표시한다", () => {
    renderState({ isLoading: true, hasItems: false });

    expect(screen.getAllByRole("cell")).toHaveLength(25);
    expect(screen.queryByText("청첩장")).not.toBeInTheDocument();
  });

  it("항목이 없으면 호출부가 준 빈 결과 문구를 표시한다", () => {
    renderState({ hasItems: false, emptyDescription: "검색 결과가 없습니다" });

    expect(screen.getByText("검색 결과가 없습니다")).toBeVisible();
    expect(screen.queryByText("청첩장")).not.toBeInTheDocument();
  });

  it("빈 상태 행은 전체 열을 차지한다", () => {
    renderState({ hasItems: false });

    expect(screen.getByRole("cell")).toHaveAttribute("colspan", "5");
  });

  it("항목이 있으면 children을 그대로 표시한다", () => {
    renderState();

    expect(screen.getByRole("cell", { name: "청첩장" })).toBeVisible();
    expect(
      screen.queryByText("등록된 항목이 없습니다"),
    ).not.toBeInTheDocument();
  });
});
