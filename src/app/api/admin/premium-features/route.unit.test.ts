// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/core/domain/error";
import type { AdminPremiumFeatureListPage } from "@/core/domain/premium-feature";
vi.mock("@/services/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/services/premiumFeature", () => ({
  getAdminPremiumFeaturesPageService: vi.fn(),
}));
import { requireAdmin } from "@/services/auth";
import { getAdminPremiumFeaturesPageService } from "@/services/premiumFeature";
import { GET } from "./route";

const request = (query = "") =>
  new NextRequest(`http://localhost/api/admin/premium-features${query}`);
const emptyPage: AdminPremiumFeatureListPage = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};
describe("GET /api/admin/premium-features", () => {
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
    vi.mocked(requireAdmin).mockRejectedValue(new AppError(category, "실패"));
    expect((await GET(request())).status).toBe(status);
    expect(getAdminPremiumFeaturesPageService).not.toHaveBeenCalled();
  });
  it("형식 오류를 400으로 반환한다", async () => {
    expect((await GET(request("?page=0"))).status).toBe(400);
  });
  it("정규화한 요청으로 서비스를 호출한다", async () => {
    vi.mocked(getAdminPremiumFeaturesPageService).mockResolvedValue(emptyPage);
    await GET(
      request("?page=2&limit=20&q=%20gallery%20&sort=label&direction=asc"),
    );
    expect(getAdminPremiumFeaturesPageService).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      q: "gallery",
      sort: "label",
      direction: "asc",
    });
  });

  it("status 파라미터를 서비스에 그대로 전달한다", async () => {
    vi.mocked(getAdminPremiumFeaturesPageService).mockResolvedValue(
      emptyPage,
    );
    await GET(request("?status=inactive"));
    expect(getAdminPremiumFeaturesPageService).toHaveBeenCalledWith(
      expect.objectContaining({ status: "inactive" }),
    );
  });

  it("허용되지 않은 status는 400을 반환한다", async () => {
    expect((await GET(request("?status=pending"))).status).toBe(400);
    expect(getAdminPremiumFeaturesPageService).not.toHaveBeenCalled();
  });
});
