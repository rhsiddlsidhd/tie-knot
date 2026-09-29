import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SearchInputBar } from "./SearchInputBar";

afterEach(() => vi.useRealTimers());

describe("SearchInputBar", () => {
  it("입력값을 trim해 300ms 뒤 한 번 검색한다", async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <SearchInputBar
        value=""
        label="상품 검색"
        onSearch={onSearch}
      />,
    );

    await user.type(screen.getByRole("searchbox", { name: "상품 검색" }), "  카드  ");
    expect(onSearch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));

    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith("카드");
  });

  it("trim한 값이 현재 value와 같으면 검색하지 않는다", async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <SearchInputBar
        value="카드"
        label="상품 검색"
        onSearch={onSearch}
      />,
    );

    const input = screen.getByRole("searchbox", { name: "상품 검색" });
    await user.clear(input);
    await user.type(input, " 카드 ");
    act(() => vi.advanceTimersByTime(300));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("외부 value 변경을 입력에 반영하고 검색을 다시 호출하지 않는다", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const { rerender } = render(
      <SearchInputBar
        value="이전 검색"
        label="상품 검색"
        onSearch={onSearch}
      />,
    );

    rerender(
      <SearchInputBar
        value="새 검색"
        label="상품 검색"
        onSearch={onSearch}
      />,
    );
    act(() => vi.advanceTimersByTime(300));

    expect(screen.getByRole("searchbox", { name: "상품 검색" })).toHaveValue(
      "새 검색",
    );
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("Enter 입력으로 폼 제출이 전파되지 않는다", async () => {
    const onSearch = vi.fn();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    const user = userEvent.setup();
    render(
      <form onSubmit={onSubmit}>
        <SearchInputBar
          value=""
          label="상품 검색"
          onSearch={onSearch}
        />
      </form>,
    );

    await user.type(
      screen.getByRole("searchbox", { name: "상품 검색" }),
      "카드{Enter}",
    );

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
