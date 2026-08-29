import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  GuestbookDemoProvider,
  initialGuestbookDemoState,
} from "@/ui/context/guestbookDemo";
import { useGuestbookModalStore } from "@/ui/stores";
import { DemoGuestbookSection } from "./DemoGuestbookSection";

// jsdom-polyfill.ts의 IntersectionObserverMock은 콜백을 저장하지 않는 no-op이라
// 교차 발생을 재현할 수 없다 — 이 파일에서만 콜백을 캡처하는 mock으로 교체한다
// (GuestbookSection.integration.test.tsx와 동일한 패턴).
let latestIntersectionCallback: IntersectionObserverCallback | null = null;
let observedCount = 0;
const nativeIntersectionObserver = globalThis.IntersectionObserver;

class CapturingIntersectionObserverMock {
  constructor(callback: IntersectionObserverCallback) {
    latestIntersectionCallback = callback;
  }
  observe() {
    observedCount += 1;
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

const intersect = async () => {
  expect(latestIntersectionCallback).not.toBeNull();
  await act(async () => {
    latestIntersectionCallback!(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  });
};

const renderDemoSection = () =>
  render(
    <GuestbookDemoProvider initialValue={initialGuestbookDemoState}>
      <DemoGuestbookSection />
    </GuestbookDemoProvider>,
  );

beforeEach(() => {
  latestIntersectionCallback = null;
  observedCount = 0;
  globalThis.IntersectionObserver =
    CapturingIntersectionObserverMock as unknown as typeof IntersectionObserver;
  useGuestbookModalStore.getState().clearIsOpen();
});

afterEach(() => {
  globalThis.IntersectionObserver = nativeIntersectionObserver;
});

describe("DemoGuestbookSection", () => {
  it("첫 페이지(10개) 목데이터를 렌더링한다", () => {
    renderDemoSection();

    expect(screen.getByText("박서준")).toBeInTheDocument();
    expect(screen.getByText("한지민")).toBeInTheDocument();
    expect(screen.queryByText("오세훈")).not.toBeInTheDocument();
  });

  it("교차 관찰 시 다음 목 페이지를 이어붙인다", async () => {
    renderDemoSection();
    expect(screen.getByText("박서준")).toBeInTheDocument();

    await intersect();

    expect(screen.getByText("박서준")).toBeInTheDocument();
    expect(screen.getByText("오세훈")).toBeInTheDocument();
    expect(screen.queryByText("송민준")).not.toBeInTheDocument();
  });

  it("마지막 페이지 이후에는 추가 로드를 중단한다", async () => {
    const { container } = renderDemoSection();

    await intersect(); // 1페이지 → 2페이지(20개)
    await intersect(); // 2페이지 → 3페이지(24개, 전체)

    expect(screen.getByText("유채원")).toBeInTheDocument();
    // hasMore가 true로 유지되는 동안(1→2페이지)은 같은 sentinel을 계속 관찰하므로
    // observer가 재생성되지 않는다 — 전체(24개)를 다 불러와 hasMore가 false로
    // 바뀐 뒤에야 sentinel이 사라지고, 그 이상 observer가 새로 생기지 않는다.
    expect(observedCount).toBe(1);
    expect(container.querySelector("ul > div.h-4")).not.toBeInTheDocument();
  });

  it("작성하기 버튼은 데모 publicKey로 모달을 연다", async () => {
    renderDemoSection();

    await userEvent.click(
      screen.getByRole("button", { name: "방명록 작성하기" }),
    );

    const modalState = useGuestbookModalStore.getState();
    expect(modalState.isOpen).toBe(true);
    expect(modalState.type).toBe("WRITE_GUESTBOOK");
    expect(modalState.payload).toEqual({ publicKey: "sample" });
  });

  it("삭제 버튼은 항목 id와 데모 publicKey를 함께 담아 모달을 연다", async () => {
    renderDemoSection();

    const firstItem = screen.getByText("박서준").closest("li");
    if (!firstItem) throw new Error("첫 방명록 항목을 찾지 못했습니다");
    await userEvent.click(within(firstItem).getByRole("button"));

    const modalState = useGuestbookModalStore.getState();
    expect(modalState.isOpen).toBe(true);
    expect(modalState.type).toBe("DELETE_GUESTBOOK");
    expect(modalState.payload).toMatchObject({
      id: initialGuestbookDemoState.entries[0].id,
      publicKey: "sample",
    });
  });

  it("실제 guestbook API를 호출하지 않는다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    renderDemoSection();
    await intersect();
    await intersect();

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
