import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
const { verifySessionMock, serviceMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
  serviceMock: vi.fn(),
}));
vi.mock("@/services/auth", () => ({ verifySession: verifySessionMock }));
vi.mock("@/services/premiumFeature", () => ({
  getAdminPremiumFeaturesPageService: serviceMock,
}));
vi.mock("@/app/(admin)/admin/premium-features/_components/PremiumFeaturesTemplate", () => ({
  PremiumFeaturesTemplate: ({ page, q }: { page: { items: unknown[] }; q?: string }) => (
    <div>템플릿:items={page.items.length}:q={q ?? "없음"}</div>
  ),
}));
import PremiumFeaturesPage from "./page";
const emptyPage = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
describe("프리미엄 기능 목록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({ role: "ADMIN", email: "a@x.com", userId: "1" });
    serviceMock.mockResolvedValue(emptyPage);
  });
  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await PremiumFeaturesPage({ searchParams: Promise.resolve({}) });
    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });
  it("offset·정렬·검색을 서비스에 전달한다", async () => {
    await PremiumFeaturesPage({
      searchParams: Promise.resolve({
        page: "2",
        limit: "20",
        q: "갤러리",
        sort: "label",
        direction: "asc",
      }),
    });
    expect(serviceMock).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      q: "갤러리",
      sort: "label",
      direction: "asc",
    });
  });
  it("서비스 결과를 템플릿에 전달한다", async () => {
    serviceMock.mockResolvedValue({ ...emptyPage, items: [{ id: "1" }], total: 1, totalPages: 1 });
    render(await PremiumFeaturesPage({ searchParams: Promise.resolve({ q: "갤러리" }) }));
    expect(screen.getByText("템플릿:items=1:q=갤러리")).toBeInTheDocument();
  });
});
