// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/core/domain/error";
import type { AdminOrderListPage } from "@/core/domain/order";

vi.mock("@/services/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/services/order", () => ({ getAdminOrdersPageService: vi.fn() }));

import { requireAdmin } from "@/services/auth";
import { getAdminOrdersPageService } from "@/services/order";
import { GET } from "./route";

const request = (query = "") =>
  new NextRequest(`http://localhost/api/admin/orders${query}`);
const emptyPage: AdminOrderListPage = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

describe("GET /api/admin/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      userId: "1",
      role: "ADMIN",
      email: "a@x.com",
    });
  });

  it.each([["UNAUTHENTICATED", 401], ["FORBIDDEN", 403]] as const)(
    "%s를 %i로 반환한다",
    async (category, status) => {
      vi.mocked(requireAdmin).mockRejectedValue(
        new AppError(category, "실패"),
      );
      expect((await GET(request())).status).toBe(status);
      expect(getAdminOrdersPageService).not.toHaveBeenCalled();
    },
  );

  it("형식 오류를 400으로 반환한다", async () => {
    expect((await GET(request("?limit=51"))).status).toBe(400);
    expect(getAdminOrdersPageService).not.toHaveBeenCalled();
  });

  it("정규화한 요청으로 서비스를 호출한다", async () => {
    vi.mocked(getAdminOrdersPageService).mockResolvedValue(emptyPage);
    await GET(
      request(
        "?page=2&limit=20&q=%20kim%20&status=CONFIRMED&sort=finalPrice&direction=asc",
      ),
    );
    expect(getAdminOrdersPageService).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      q: "kim",
      status: "CONFIRMED",
      sort: "finalPrice",
      direction: "asc",
    });
  });
});
