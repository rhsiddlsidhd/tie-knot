import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OffsetPagination } from "./OffsetPagination";

describe("OffsetPagination", () => {
  it("현재 페이지와 생략된 페이지 범위를 표시한다", () => {
    render(
      <OffsetPagination
        page={6}
        totalPages={20}
        total={195}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "6페이지" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getAllByText("More pages")).toHaveLength(2);
    expect(screen.getByText("총 195건")).toBeVisible();
  });

  it("첫 페이지에서는 이전 버튼을 비활성화한다", () => {
    render(
      <OffsetPagination
        page={1}
        totalPages={5}
        total={50}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "이전 페이지" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "다음 페이지" })).toBeEnabled();
  });

  it("마지막 페이지에서는 다음 버튼을 비활성화한다", () => {
    render(
      <OffsetPagination
        page={5}
        totalPages={5}
        total={50}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "이전 페이지" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "다음 페이지" })).toBeDisabled();
  });

  it("페이지 버튼을 누르면 해당 페이지를 전달한다", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <OffsetPagination
        page={2}
        totalPages={5}
        total={50}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "3페이지" }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("한 페이지 이하면 번호 영역을 숨기고 총 건수는 표시한다", () => {
    render(
      <OffsetPagination
        page={1}
        totalPages={1}
        total={4}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByText("총 4건")).toBeVisible();
  });
});
