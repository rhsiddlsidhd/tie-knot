import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useEvent } from "./useEvent";

describe("useEvent", () => {
  it("핸들러가 매 렌더 새로 만들어져도 반환 참조는 고정된다", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useEvent(() => value),
      { initialProps: { value: 1 } },
    );
    const first = result.current;

    rerender({ value: 2 });
    rerender({ value: 3 });

    expect(result.current).toBe(first);
  });

  it("호출 시점의 최신 클로저를 실행한다", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useEvent(() => value),
      { initialProps: { value: 1 } },
    );
    const stableHandler = result.current;

    rerender({ value: 2 });

    // 첫 렌더에서 받아둔 참조로 호출해도 갱신된 값을 읽는다.
    expect(stableHandler()).toBe(2);
  });

  it("인자와 반환값을 그대로 전달한다", () => {
    const { result } = renderHook(() =>
      useEvent((a: number, b: string) => `${a}-${b}`),
    );

    expect(result.current(1, "a")).toBe("1-a");
  });

  it("상태 변경으로 리렌더돼도 참조가 유지되고 최신 상태를 읽는다", () => {
    const { result, rerender } = renderHook(
      ({ items }: { items: string[] }) => useEvent(() => items.length),
      { initialProps: { items: [] as string[] } },
    );
    const stableHandler = result.current;

    act(() => rerender({ items: ["a", "b"] }));

    expect(result.current).toBe(stableHandler);
    expect(stableHandler()).toBe(2);
  });
});
