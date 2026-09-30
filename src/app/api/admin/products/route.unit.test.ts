// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/core/domain/error";
import type { AdminProductListPage } from "@/core/domain/product";

vi.mock("@/services/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/services/product", () => ({
  getAdminProductsPageService: vi.fn(),
}));

import { requireAdmin } from "@/services/auth";
import { getAdminProductsPageService } from "@/services/product";
import { GET } from "./route";

const buildRequest = (query = "") =>
  new NextRequest(`http://localhost/api/admin/products${query}`);

const emptyPage: AdminProductListPage = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

describe("GET /api/admin/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      userId: "admin-1",
      role: "ADMIN",
      email: "admin@example.com",
    });
  });

  it.each([
    ["UNAUTHENTICATED", 401],
    ["FORBIDDEN", 403],
  ] as const)(
    "관리자 인증 실패 %s를 %i로 반환한다",
    async (category, status) => {
      vi.mocked(requireAdmin).mockRejectedValue(
        new AppError(category, "관리자 인증 실패"),
      );

      const response = await GET(buildRequest());

      expect(response.status).toBe(status);
      expect(getAdminProductsPageService).not.toHaveBeenCalled();
    },
  );

  it("형식이 잘못된 요청은 400을 반환한다", async () => {
    const response = await GET(buildRequest("?page=0&sort=unknown"));

    expect(response.status).toBe(400);
    expect(getAdminProductsPageService).not.toHaveBeenCalled();
  });

  it("정규화한 요청으로 서비스를 호출한다", async () => {
    vi.mocked(getAdminProductsPageService).mockResolvedValue(emptyPage);

    const response = await GET(
      buildRequest(
        "?page=2&limit=25&q=%20card%20&sort=price&direction=asc&softDeleted=true",
      ),
    );

    expect(response.status).toBe(200);
    expect(getAdminProductsPageService).toHaveBeenCalledWith({
      page: 2,
      limit: 25,
      q: "card",
      sort: "price",
      direction: "asc",
      softDeleted: true,
    });
  });

  it("status·type 파라미터를 서비스에 그대로 전달한다", async () => {
    vi.mocked(getAdminProductsPageService).mockResolvedValue(emptyPage);

    const response = await GET(buildRequest("?status=inactive&type=premium"));

    expect(response.status).toBe(200);
    expect(getAdminProductsPageService).toHaveBeenCalledWith(
      expect.objectContaining({ status: "inactive", type: "premium" }),
    );
  });

  it("허용되지 않은 status는 400을 반환한다", async () => {
    const response = await GET(buildRequest("?status=deleted"));

    expect(response.status).toBe(400);
    expect(getAdminProductsPageService).not.toHaveBeenCalled();
  });
});
