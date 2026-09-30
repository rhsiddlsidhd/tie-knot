// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/core/domain/error";
import type { OrderListPage } from "@/core/domain/order";

vi.mock("@/services/auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/services/order", () => ({
  getOrdersPageForUser: vi.fn(),
}));

import { requireAuth } from "@/services/auth";
import { getOrdersPageForUser } from "@/services/order";
import { GET } from "./route";

const buildRequest = (query: string) =>
  new NextRequest(`http://localhost/api/orders${query}`);

const session = { userId: "user-1", role: "USER", email: "u@example.com" };
const emptyPage: OrderListPage = { items: [], nextCursor: null };

describe("GET /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(session as never);
  });

  it("세션이 없으면 401을 리턴하고 서비스는 호출되지 않는다", async () => {
    vi.mocked(requireAuth).mockRejectedValue(
      new AppError("UNAUTHENTICATED", "인증이 필요합니다."),
    );

    const res = await GET(buildRequest(""));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.category).toBe("UNAUTHENTICATED");
    expect(getOrdersPageForUser).not.toHaveBeenCalled();
  });

  it("필터가 없으면 세션 userId만 담아 서비스를 호출하고 200을 리턴한다", async () => {
    vi.mocked(getOrdersPageForUser).mockResolvedValue(emptyPage);

    const res = await GET(buildRequest(""));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, data: emptyPage });
    expect(getOrdersPageForUser).toHaveBeenCalledWith({
      userId: "user-1",
      status: undefined,
      category: undefined,
      cursor: undefined,
    });
  });

  it("status·category·cursor를 정규화해 세션 userId와 함께 서비스에 전달한다", async () => {
    vi.mocked(getOrdersPageForUser).mockResolvedValue(emptyPage);

    const res = await GET(
      buildRequest("?status=CONFIRMED&category=favor&cursor=abc"),
    );

    expect(res.status).toBe(200);
    expect(getOrdersPageForUser).toHaveBeenCalledWith({
      userId: "user-1",
      status: "CONFIRMED",
      category: "favor",
      cursor: "abc",
    });
  });

  it("빈 문자열 필터는 필터 해제로 정규화한다", async () => {
    vi.mocked(getOrdersPageForUser).mockResolvedValue(emptyPage);

    await GET(buildRequest("?status=&category=&cursor="));

    expect(getOrdersPageForUser).toHaveBeenCalledWith({
      userId: "user-1",
      status: undefined,
      category: undefined,
      cursor: undefined,
    });
  });

  it("허용되지 않은 status면 400 VALIDATION을 리턴하고 서비스는 호출되지 않는다", async () => {
    const res = await GET(buildRequest("?status=UNKNOWN"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.category).toBe("VALIDATION");
    expect(getOrdersPageForUser).not.toHaveBeenCalled();
  });

  it("서비스가 AppError(INTERNAL)를 던지면 500을 리턴한다", async () => {
    vi.mocked(getOrdersPageForUser).mockRejectedValue(
      new AppError("INTERNAL", "DB 오류"),
    );

    const res = await GET(buildRequest(""));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
