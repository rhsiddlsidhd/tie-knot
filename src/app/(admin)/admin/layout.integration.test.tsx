import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { http, HttpResponse, delay } from "msw";
import { setupServer } from "msw/node";
import type * as AtomsModule from "@/client/components/atoms";

const adminSession = { role: "ADMIN" as const, email: "admin@b.com", userId: "user-1" };

const server = setupServer(
  http.get("http://localhost/api/auth/me", async () => {
    await delay(50);
    return HttpResponse.json({ success: true, data: adminSession });
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

vi.mock("@/client/components/atoms", async (importOriginal) => {
  const actual = await importOriginal<typeof AtomsModule>();
  const Passthrough = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    ...actual,
    SidebarProvider: Passthrough,
    Sidebar: Passthrough,
    SidebarContent: Passthrough,
    SidebarFooter: Passthrough,
  };
});
vi.mock("@/client/components/organisms", () => ({
  SidebarToggle: (): null => null,
}));
vi.mock("@/client/components/molecules", () => ({
  SidebarNavItem: (): null => null,
}));
vi.mock("./_components", () => ({ AdminModal: (): null => null }));

import AdminLayout from "./layout";

const renderWithRealSwr = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <AdminLayout>children</AdminLayout>
    </SWRConfig>,
  );

describe("실제 useAuth(useSWR) + MSW /api/auth/me 경계", () => {
  it("응답이 도착하기 전엔 관리자/일반 계정 어느 쪽도 표시하지 않는다", () => {
    renderWithRealSwr();

    expect(screen.queryByText("관리자 계정")).not.toBeInTheDocument();
    expect(screen.queryByText("일반 계정")).not.toBeInTheDocument();
  });

  it("응답이 도착하면 실제 세션의 email/role을 사이드바 푸터에 렌더한다", async () => {
    renderWithRealSwr();

    await waitFor(() => expect(screen.getByText("admin@b.com")).toBeInTheDocument());
    expect(screen.getByText("관리자 계정")).toBeInTheDocument();
  });
});
