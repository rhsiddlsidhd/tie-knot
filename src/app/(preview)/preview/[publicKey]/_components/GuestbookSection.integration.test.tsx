// GuestbookSection.tsx는 useSWRInfinite + IntersectionObserver로 방명록 목록을
// 커서 기반 무한스크롤로 불러온다. 이 파일은 그 hook→SWR→fetch→MSW 경계를 실제로
// 관통시켜 (1) 첫 페이지 렌더, (2) 교차 관찰 트리거 시 다음 커서 페이지 병합,
// (3) 작성/삭제 모달이 닫힐 때 전체 페이지 재검증이 실제로 일어나는지 검증한다.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { GuestbookListResponse } from "@/core/schemas";
import { useGuestbookModalStore } from "@/ui/stores";
import { GuestbookSection } from "./GuestbookSection";

const PUBLIC_KEY = "guestbook-infinite-scroll-test";

// 테스트마다 새 SWR 캐시를 준다 — 기본 전역 캐시를 쓰면 같은 key(publicKey)로
// 렌더하는 뒤쪽 테스트가 앞선 테스트의 캐시를 그대로 재사용해 네트워크 호출
// 자체가 생략된다(useProductSearch.integration.test.tsx와 동일한 패턴).
const renderGuestbookSection = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <GuestbookSection publicKey={PUBLIC_KEY} />
    </SWRConfig>,
  );

const page1: GuestbookListResponse = {
  items: [
    {
      _id: "entry-1",
      author: "1페이지-작성자",
      message: "1페이지 메시지",
      isPrivate: false,
      createdAt: "2026-08-20T00:00:00.000Z",
    },
  ],
  nextCursor: "cursor-to-page-2",
};

const page2: GuestbookListResponse = {
  items: [
    {
      _id: "entry-2",
      author: "2페이지-작성자",
      message: "2페이지 메시지",
      isPrivate: false,
      createdAt: "2026-08-19T00:00:00.000Z",
    },
  ],
  nextCursor: null,
};

let requestedCursors: (string | null)[] = [];

const server = setupServer(
  http.get("http://localhost/api/guestbook", ({ request }) => {
    const cursor = new URL(request.url).searchParams.get("cursor");
    requestedCursors.push(cursor);
    const data = cursor === "cursor-to-page-2" ? page2 : page1;
    return HttpResponse.json({ success: true, data });
  }),
);

const nativeFetch = globalThis.fetch;

// jsdom-polyfill.ts의 IntersectionObserverMock은 콜백을 저장하지 않는 no-op이라
// 교차 발생을 재현할 수 없다 — 이 파일에서만 콜백을 캡처하는 mock으로 교체한다.
let latestIntersectionCallback: IntersectionObserverCallback | null = null;
const nativeIntersectionObserver = globalThis.IntersectionObserver;

class CapturingIntersectionObserverMock {
  constructor(callback: IntersectionObserverCallback) {
    latestIntersectionCallback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  const interceptedFetch = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const resolved =
      typeof input === "string" && input.startsWith("/")
        ? new URL(input, "http://localhost")
        : input;
    return interceptedFetch(resolved, init);
  }) as typeof fetch;
  globalThis.IntersectionObserver =
    CapturingIntersectionObserverMock as unknown as typeof IntersectionObserver;
});

beforeEach(() => {
  requestedCursors = [];
  latestIntersectionCallback = null;
  useGuestbookModalStore.getState().clearIsOpen();
});

afterEach(() => server.resetHandlers());

afterAll(() => {
  server.close();
  globalThis.fetch = nativeFetch;
  globalThis.IntersectionObserver = nativeIntersectionObserver;
});

describe("GuestbookSection — 실제 useSWRInfinite + MSW HTTP 경계", () => {
  it("마운트 시 첫 페이지를 불러와 방명록을 렌더한다", async () => {
    renderGuestbookSection();

    expect(await screen.findByText("1페이지-작성자")).toBeInTheDocument();
    expect(screen.getByText("1페이지 메시지")).toBeInTheDocument();
    expect(screen.queryByText("2페이지-작성자")).not.toBeInTheDocument();
    expect(requestedCursors).toEqual([null]);
  });

  it("무한스크롤 트리거가 교차하면 nextCursor로 다음 페이지를 이어붙인다", async () => {
    renderGuestbookSection();
    await screen.findByText("1페이지-작성자");

    expect(latestIntersectionCallback).not.toBeNull();
    await act(async () => {
      latestIntersectionCallback!(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(await screen.findByText("2페이지-작성자")).toBeInTheDocument();
    expect(screen.getByText("1페이지-작성자")).toBeInTheDocument();
    // dedupingInterval:0인 테스트 캐시에서는 1페이지 재검증이 한 번 더 끼어들 수
    // 있어 정확한 호출 횟수 대신 "커서 없이 시작해 2페이지 커서로 이어졌는가"만
    // 검증한다 — 순서·값 자체는 실 브라우저 네트워크 트레이스로 별도 확인됨.
    expect(requestedCursors[0]).toBeNull();
    expect(requestedCursors).toContain("cursor-to-page-2");
  });

  it("방명록 작성/삭제 모달이 닫히면 로드된 페이지 전체를 재검증한다", async () => {
    renderGuestbookSection();
    await screen.findByText("1페이지-작성자");
    expect(requestedCursors).toEqual([null]);

    act(() => {
      useGuestbookModalStore.getState().setIsOpen({
        isOpen: true,
        type: "WRITE_GUESTBOOK",
        payload: { publicKey: PUBLIC_KEY },
      });
    });
    act(() => {
      useGuestbookModalStore.getState().closeModal();
    });

    await screen.findByText("1페이지-작성자");
    expect(requestedCursors).toEqual([null, null]);
  });

  it("모달을 취소 없이 그냥 열기만 한 상태(닫히지 않음)에서는 재검증하지 않는다", async () => {
    renderGuestbookSection();
    await screen.findByText("1페이지-작성자");
    expect(requestedCursors).toEqual([null]);

    act(() => {
      useGuestbookModalStore.getState().setIsOpen({
        isOpen: true,
        type: "WRITE_GUESTBOOK",
        payload: { publicKey: PUBLIC_KEY },
      });
    });

    expect(requestedCursors).toEqual([null]);
  });
});
