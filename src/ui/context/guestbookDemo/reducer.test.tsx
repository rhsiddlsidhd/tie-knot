import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { GuestbookDemoProvider, initialGuestbookDemoState, useGuestbookDemo } from "./reducer";

const wrapper = ({ children }: { children: ReactNode }) => (
  <GuestbookDemoProvider initialValue={initialGuestbookDemoState}>
    {children}
  </GuestbookDemoProvider>
);

describe("guestbookDemoReducer", () => {
  it("초기 목데이터는 여러 페이지 분량(10개 초과)이다", () => {
    expect(initialGuestbookDemoState.entries.length).toBeGreaterThan(10);
  });

  it("ADD_ENTRY는 새 항목을 목록 맨 위에 추가한다", () => {
    const { result } = renderHook(() => useGuestbookDemo(), { wrapper });

    act(() => {
      result.current[1]({
        type: "ADD_ENTRY",
        payload: { author: "테스트", message: "안녕하세요", password: "1234" },
      });
    });

    expect(result.current[0].entries[0]).toMatchObject({
      author: "테스트",
      message: "안녕하세요",
      password: "1234",
    });
    expect(result.current[0].entries).toHaveLength(
      initialGuestbookDemoState.entries.length + 1,
    );
  });

  it("REMOVE_ENTRY는 id가 일치하는 항목만 제거한다", () => {
    const targetId = initialGuestbookDemoState.entries[0].id;
    const { result } = renderHook(() => useGuestbookDemo(), { wrapper });

    act(() => {
      result.current[1]({ type: "REMOVE_ENTRY", payload: { id: targetId } });
    });

    expect(
      result.current[0].entries.find((entry) => entry.id === targetId),
    ).toBeUndefined();
    expect(result.current[0].entries).toHaveLength(
      initialGuestbookDemoState.entries.length - 1,
    );
  });
});
