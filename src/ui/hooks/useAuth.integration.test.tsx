import type { PropsWithChildren } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { http, HttpResponse, delay } from "msw";
import { setupServer } from "msw/node";
import type { AuthSession } from "@/core/schemas";
import { useAuth } from "./useAuth";

const session: AuthSession = {
  role: "ADMIN",
  email: "admin@b.com",
  userId: "user-1",
};

// /api/auth/me는 routeSuccess(session)을 리턴한다 — 세션이 없으면 data가 null이다.
const server = setupServer(
  http.get("http://localhost/api/auth/me", async () => {
    await delay(50);
    return HttpResponse.json({ success: true, data: session });
  }),
);

const nativeFetch = globalThis.fetch;

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  const interceptedFetch = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const resolved = typeof input === "string" && input.startsWith("/")
      ? new URL(input, "http://localhost")
      : input;
    return interceptedFetch(resolved, init);
  }) as typeof fetch;
});
afterEach(() => server.resetHandlers());
afterAll(() => { server.close(); globalThis.fetch = nativeFetch; });

const wrapper = ({ children }: PropsWithChildren) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
);

describe("실제 useSWR + fetcher + MSW /api/auth/me 경계", () => {
  it("성공 응답 봉투를 fetcher가 벗겨 session으로 그대로 노출한다", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.session).toEqual(session));
    expect(result.current.isLoading).toBe(false);
  });

  it("세션이 없으면(data:null) session이 null이다", async () => {
    server.use(
      http.get("http://localhost/api/auth/me", () =>
        HttpResponse.json({ success: true, data: null }),
      ),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.session).toBeNull();
  });

  it("응답이 도착하기 전엔 isLoading:true이고 session은 null이다", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.session).toBeNull();
  });
});
