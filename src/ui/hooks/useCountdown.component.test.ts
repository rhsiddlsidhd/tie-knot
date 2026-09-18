import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useCountdown } from "./useCountdown";

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00+09:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("렌더링 즉시 목표일까지 남은 시간을 계산한다", () => {
    const target = new Date("2026-01-03T00:00:00+09:00");

    const { result } = renderHook(() => useCountdown(target));

    expect(result.current.countdown).toEqual({ days: 2, hour: 0, min: 0, sec: 0 });
    expect(result.current.message).toBe("결혼식까지 2일 남았습니다");
  });

  it("1초마다 countdown을 다시 계산한다", () => {
    const target = new Date("2026-01-01T00:00:01+09:00");

    const { result } = renderHook(() => useCountdown(target));

    expect(result.current.countdown.sec).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.countdown).toEqual({ days: 0, hour: 0, min: 0, sec: 0 });
  });

  it("남은 일수가 없으면 시간 단위 메시지를 노출한다", () => {
    const target = new Date("2026-01-01T02:00:00+09:00");

    const { result } = renderHook(() => useCountdown(target));

    expect(result.current.message).toBe("결혼식까지 2시간 남았습니다");
  });

  it("목표일이 지나면 종료 메시지를 노출하고 countdown은 0으로 고정된다", () => {
    const target = new Date("2025-12-31T00:00:00+09:00");

    const { result } = renderHook(() => useCountdown(target));

    expect(result.current.countdown).toEqual({ days: 0, hour: 0, min: 0, sec: 0 });
    expect(result.current.message).toBe("결혼식이 끝났습니다");
  });

  it("targetDate가 바뀌면 새 목표로 다시 계산한다", () => {
    const first = new Date("2026-01-02T00:00:00+09:00");
    const second = new Date("2026-01-05T00:00:00+09:00");

    const { result, rerender } = renderHook(({ target }) => useCountdown(target), {
      initialProps: { target: first },
    });
    expect(result.current.countdown.days).toBe(1);

    rerender({ target: second });

    expect(result.current.countdown.days).toBe(4);
  });

  it("unmount하면 interval을 정리한다", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");
    const target = new Date("2026-01-03T00:00:00+09:00");

    const { unmount } = renderHook(() => useCountdown(target));
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });
});
