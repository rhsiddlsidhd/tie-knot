import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useIsMobile } from "./useMobile";

type Listener = () => void;

const setInnerWidth = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
};

describe("useIsMobile", () => {
  const originalMatchMedia = window.matchMedia;
  const originalInnerWidth = window.innerWidth;
  let listeners: Listener[];

  beforeEach(() => {
    listeners = [];
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_event: string, listener: Listener) => {
        listeners.push(listener);
      },
      removeEventListener: (_event: string, listener: Listener) => {
        listeners = listeners.filter((registered) => registered !== listener);
      },
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    setInnerWidth(originalInnerWidth);
  });

  it("viewport가 768px 미만이면 true를 리턴한다", () => {
    setInnerWidth(500);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("viewport가 768px 이상이면 false를 리턴한다", () => {
    setInnerWidth(1024);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("media query change 이벤트가 발생하면 값을 다시 계산한다", () => {
    setInnerWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    setInnerWidth(500);
    act(() => {
      listeners.forEach((listener) => listener());
    });

    expect(result.current).toBe(true);
  });

  it("unmount하면 change 이벤트 구독을 해제한다", () => {
    const { unmount } = renderHook(() => useIsMobile());
    expect(listeners.length).toBe(1);

    unmount();

    expect(listeners.length).toBe(0);
  });
});
