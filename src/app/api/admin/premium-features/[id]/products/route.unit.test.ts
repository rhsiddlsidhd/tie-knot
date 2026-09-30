// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/core/domain/error";
vi.mock("@/services/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/services/premiumFeature", () => ({
  getPremiumFeatureService: vi.fn(),
}));
vi.mock("@/services/product", () => ({
  getFeatureProductBindingsPageService: vi.fn(),
}));
import { requireAdmin } from "@/services/auth";
import { getPremiumFeatureService } from "@/services/premiumFeature";
import { getFeatureProductBindingsPageService } from "@/services/product";
import { GET } from "./route";

const id = "507f1f77bcf86cd799439011";
const request = (query = "") =>
  new NextRequest(
    `http://localhost/api/admin/premium-features/${id}/products${query}`,
  );
const context = (value = id) => ({ params: Promise.resolve({ id: value }) });
describe("GET /api/admin/premium-features/[id]/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({
      userId: "1",
      role: "ADMIN",
      email: "a@x.com",
    });
    vi.mocked(getPremiumFeatureService).mockResolvedValue([
      { _id: id } as never,
    ]);
    vi.mocked(getFeatureProductBindingsPageService).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
  });
  it.each([
    ["UNAUTHENTICATED", 401],
    ["FORBIDDEN", 403],
  ] as const)("%s를 %i로 반환한다", async (category, status) => {
    vi.mocked(requireAdmin).mockRejectedValue(new AppError(category, "실패"));
    expect((await GET(request(), context())).status).toBe(status);
  });
  it("ObjectId 형식이 아니면 400을 반환한다", async () => {
    expect((await GET(request(), context("bad-id"))).status).toBe(400);
    expect(getFeatureProductBindingsPageService).not.toHaveBeenCalled();
  });
  it("기능이 없으면 404를 반환한다", async () => {
    vi.mocked(getPremiumFeatureService).mockResolvedValue([]);
    expect((await GET(request(), context())).status).toBe(404);
  });
  it("정규화한 요청과 featureId로 서비스를 호출한다", async () => {
    await GET(
      request("?page=2&limit=20&q=%20card%20&sort=price&direction=asc"),
      context(),
    );
    expect(getFeatureProductBindingsPageService).toHaveBeenCalledWith({
      featureId: id,
      page: 2,
      limit: 20,
      q: "card",
      sort: "price",
      direction: "asc",
    });
  });

  it("attached 파라미터를 서비스에 그대로 전달한다", async () => {
    await GET(request("?attached=unattached"), context());
    expect(getFeatureProductBindingsPageService).toHaveBeenCalledWith(
      expect.objectContaining({ attached: "unattached" }),
    );
  });

  it("허용되지 않은 attached는 400을 반환한다", async () => {
    expect((await GET(request("?attached=yes"), context())).status).toBe(400);
    expect(getFeatureProductBindingsPageService).not.toHaveBeenCalled();
  });
});
