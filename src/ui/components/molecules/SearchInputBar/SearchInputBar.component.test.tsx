import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SearchInputBar } from "./SearchInputBar";

afterEach(() => vi.useRealTimers());

describe("SearchInputBar", () => {
  it("입력값을 trim해 300ms 뒤 한 번 검색한다", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    render(
      <SearchInputBar
        value=""
        label="상품 검색"
        onSearch={onSearch}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "상품 검색" }), {
      target: { value: "  카드  " },
    });
    expect(onSearch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));

    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith("카드");
  });

  it("trim한 값이 현재 value와 같으면 검색하지 않는다", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    render(
      <SearchInputBar
        value="카드"
        label="상품 검색"
        onSearch={onSearch}
      />,
    );

    const input = screen.getByRole("searchbox", { name: "상품 검색" });
    fireEvent.change(input, { target: { value: " 카드 " } });
    act(() => vi.advanceTimersByTime(300));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("보낸 검색값이 돌아와도 그 뒤에 입력한 내용을 유지한다", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const { rerender } = render(
      <SearchInputBar value="" label="상품 검색" onSearch={onSearch} />,
    );
    const input = screen.getByRole("searchbox", { name: "상품 검색" });

    fireEvent.change(input, { target: { value: "abc" } });
    act(() => vi.advanceTimersByTime(300));
    expect(onSearch).toHaveBeenCalledWith("abc");

    fireEvent.change(input, { target: { value: "abcd" } });
    rerender(
      <SearchInputBar value="abc" label="상품 검색" onSearch={onSearch} />,
    );

    expect(input).toHaveValue("abcd");
  });

  it("trim한 검색값이 돌아와도 입력 끝의 공백을 유지한다", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const { rerender } = render(
      <SearchInputBar value="" label="상품 검색" onSearch={onSearch} />,
    );
    const input = screen.getByRole("searchbox", { name: "상품 검색" });

    fireEvent.change(input, { target: { value: "청첩장 " } });
    act(() => vi.advanceTimersByTime(300));
    expect(onSearch).toHaveBeenCalledWith("청첩장");

    rerender(
      <SearchInputBar value="청첩장" label="상품 검색" onSearch={onSearch} />,
    );

    expect(input).toHaveValue("청첩장 ");
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

  it("debounce 도중 onSearch가 바뀌면 마지막 onSearch로 한 번만 검색한다", () => {
    vi.useFakeTimers();
    const previousOnSearch = vi.fn();
    const nextOnSearch = vi.fn();
    const { rerender } = render(
      <SearchInputBar value="" label="상품 검색" onSearch={previousOnSearch} />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "상품 검색" }), {
      target: { value: "카드" },
    });
    rerender(
      <SearchInputBar value="" label="상품 검색" onSearch={nextOnSearch} />,
    );
    act(() => vi.advanceTimersByTime(300));

    expect(previousOnSearch).not.toHaveBeenCalled();
    expect(nextOnSearch).toHaveBeenCalledOnce();
    expect(nextOnSearch).toHaveBeenCalledWith("카드");
  });

  // 외부에서 검색어가 지워진 직후(뒤로 가기 등) 300ms 안에 다른 URL 변경으로
  // onSearch가 다시 바뀌어도, debounce가 아직 들고 있는 이전 검색어를 보내지 않는다.
  it("외부에서 검색어가 지워진 뒤 onSearch가 바뀌어도 이전 검색어를 다시 보내지 않는다", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const { rerender } = render(
      <SearchInputBar value="카드" label="상품 검색" onSearch={vi.fn()} />,
    );

    rerender(<SearchInputBar value="" label="상품 검색" onSearch={vi.fn()} />);
    rerender(
      <SearchInputBar value="" label="상품 검색" onSearch={onSearch} />,
    );
    act(() => vi.advanceTimersByTime(300));

    expect(screen.getByRole("searchbox", { name: "상품 검색" })).toHaveValue(
      "",
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
