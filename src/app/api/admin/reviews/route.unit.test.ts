// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/core/domain/error";
import type { AdminReviewListPage } from "@/core/domain/review";

vi.mock("@/services/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/services/review", () => ({ getAdminReviewsPageService: vi.fn() }));
import { requireAdmin } from "@/services/auth";
import { getAdminReviewsPageService } from "@/services/review";
import { GET } from "./route";

const request = (query = "") =>
  new NextRequest(`http://localhost/api/admin/reviews${query}`);
const emptyPage: AdminReviewListPage = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

describe("GET /api/admin/reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      userId: "1",
      role: "ADMIN",
      email: "a@x.com",
    });
  });
  it.each([
    ["UNAUTHENTICATED", 401],
    ["FORBIDDEN", 403],
  ] as const)("%s를 %i로 반환한다", async (category, status) => {
    vi.mocked(requireAdmin).mockRejectedValue(
      new AppError(category, "실패"),
    );
    expect((await GET(request())).status).toBe(status);
    expect(getAdminReviewsPageService).not.toHaveBeenCalled();
  });
  it("형식 오류를 400으로 반환한다", async () => {
    expect((await GET(request("?sort=content"))).status).toBe(400);
  });
  it("정규화한 요청으로 서비스를 호출한다", async () => {
    vi.mocked(getAdminReviewsPageService).mockResolvedValue(emptyPage);
    await GET(
      request("?page=2&limit=20&q=%20item%20&sort=rating&direction=asc"),
    );
    expect(getAdminReviewsPageService).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      q: "item",
      sort: "rating",
      direction: "asc",
    });
  });
});
