import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useImageList } from "./useImageList";

describe("useImageList", () => {
  it("같은 인스턴스에서 추가할수록 id가 단조 증가하고 서로 겹치지 않는다", () => {
    const { result } = renderHook(() => useImageList());

    act(() => result.current.add(["url-a"]));
    act(() => result.current.add(["url-b", "url-c"]));

    const ids = result.current.items.map((item) => Number(item.id));
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("서로 다른 훅 인스턴스는 독립된 카운터를 사용해 id가 섞이지 않는다", () => {
    const first = renderHook(() => useImageList());
    const second = renderHook(() => useImageList());

    act(() => first.result.current.add(["a1", "a2"]));
    act(() => second.result.current.add(["b1"]));
    act(() => first.result.current.add(["a3"]));

    expect(first.result.current.items.map((item) => item.id)).toEqual([
      "0",
      "1",
      "2",
    ]);
    expect(second.result.current.items.map((item) => item.id)).toEqual(["0"]);
  });

  it("defaultUrls로 초기화한 항목과 이후 추가 항목의 id가 충돌하지 않는다", () => {
    const { result, rerender } = renderHook(
      ({ defaultUrls }: { defaultUrls?: string[] }) =>
        useImageList(defaultUrls),
      { initialProps: { defaultUrls: undefined as string[] | undefined } },
    );

    // useSWR 비동기 로드를 흉내내 defaultUrls가 뒤늦게 채워지는 상황을 재현한다.
    act(() => rerender({ defaultUrls: ["init-1", "init-2"] }));
    act(() => result.current.add(["added-1"]));

    const ids = result.current.items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(result.current.getUrls()).toEqual([
      "init-1",
      "init-2",
      "added-1",
    ]);
  });

  it("remove(id)는 해당 항목만 제거한다", () => {
    const { result } = renderHook(() => useImageList());

    act(() => result.current.add(["url-a", "url-b"]));
    const [first, second] = result.current.items;

    act(() => result.current.remove(first!.id));

    expect(result.current.items).toEqual([second]);
    expect(result.current.getUrls()).toEqual(["url-b"]);
  });

  it("reset()은 모든 항목을 제거한다", () => {
    const { result } = renderHook(() => useImageList());

    act(() => result.current.add(["url-a", "url-b"]));
    act(() => result.current.reset());

    expect(result.current.items).toEqual([]);
    expect(result.current.getUrls()).toEqual([]);
  });
});
