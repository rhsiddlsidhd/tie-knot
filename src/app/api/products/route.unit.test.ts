// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/core/domain/error";
import type { PublicProductListPage } from "@/core/domain/product";

vi.mock("@/services/product", () => ({
  getPublicProductsPageService: vi.fn(),
}));

import { getPublicProductsPageService } from "@/services/product";
import { GET } from "./route";

const buildRequest = (query: string) =>
  new NextRequest(`http://localhost/api/products${query}`);

const emptyPage: PublicProductListPage = { items: [], nextCursor: null };

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("필터가 없으면 조건 없이 서비스를 호출하고 200을 리턴한다", async () => {
    vi.mocked(getPublicProductsPageService).mockResolvedValue(emptyPage);

    const res = await GET(buildRequest(""));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, data: emptyPage });
    expect(getPublicProductsPageService).toHaveBeenCalledWith({
      category: undefined,
      subCategory: undefined,
      cursor: undefined,
    });
  });

  it("category·subCategory·cursor를 정규화해 서비스에 전달한다", async () => {
    vi.mocked(getPublicProductsPageService).mockResolvedValue(emptyPage);

    const res = await GET(
      buildRequest("?category=favor&subCategory=candle&cursor=abc"),
    );

    expect(res.status).toBe(200);
    expect(getPublicProductsPageService).toHaveBeenCalledWith({
      category: "favor",
      subCategory: "candle",
      cursor: "abc",
    });
  });

  it("빈 문자열 필터는 필터 해제로 정규화한다", async () => {
    vi.mocked(getPublicProductsPageService).mockResolvedValue(emptyPage);

    await GET(buildRequest("?category=&subCategory=&cursor="));

    expect(getPublicProductsPageService).toHaveBeenCalledWith({
      category: undefined,
      subCategory: undefined,
      cursor: undefined,
    });
  });

  it("허용되지 않은 category면 400 VALIDATION을 리턴하고 서비스는 호출되지 않는다", async () => {
    const res = await GET(buildRequest("?category=unknown"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.category).toBe("VALIDATION");
    expect(getPublicProductsPageService).not.toHaveBeenCalled();
  });

  it("서비스가 AppError(INTERNAL)를 던지면 500을 리턴한다", async () => {
    vi.mocked(getPublicProductsPageService).mockRejectedValue(
      new AppError("INTERNAL", "DB 오류"),
    );

    const res = await GET(buildRequest(""));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
