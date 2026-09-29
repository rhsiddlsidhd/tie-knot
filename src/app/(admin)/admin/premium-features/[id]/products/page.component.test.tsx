import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
const { verifySessionMock, featureMock, bindingsMock, notFoundMock } =
  vi.hoisted(() => ({
    verifySessionMock: vi.fn(),
    featureMock: vi.fn(),
    bindingsMock: vi.fn(),
    notFoundMock: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
  }));
vi.mock("@/services/auth", () => ({ verifySession: verifySessionMock }));
vi.mock("@/services/premiumFeature", () => ({
  getPremiumFeatureService: featureMock,
}));
vi.mock("@/services/product", () => ({
  getFeatureProductBindingsPageService: bindingsMock,
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock(
  "@/app/(admin)/admin/premium-features/[id]/products/_components/FeatureProductBindingTemplate",
  () => ({
    FeatureProductBindingTemplate: ({
      featureLabel,
      q,
      page,
    }: {
      featureLabel: string;
      q?: string;
      page: { items: unknown[] };
    }) => (
      <div>{`Template:${featureLabel}:q=${q ?? ""}:${page.items.length}`}</div>
    ),
  }),
);
import FeatureProductsPage from "./page";
const feature = { _id: "feature-1", label: "갤러리 확대 보기" };
const emptyPage = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
const callPage = (searchParams: Record<string, string> = {}) =>
  FeatureProductsPage({
    params: Promise.resolve({ id: "feature-1" }),
    searchParams: Promise.resolve(searchParams),
  });
describe("기능별 연결 상품 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({ role: "ADMIN" });
    featureMock.mockResolvedValue([feature]);
    bindingsMock.mockResolvedValue(emptyPage);
  });
  it("ADMIN 권한을 확인하고 offset·정렬·검색을 서비스에 전달한다", async () => {
    await callPage({
      page: "2",
      limit: "20",
      q: "봄",
      sort: "price",
      direction: "asc",
    });
    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
    expect(bindingsMock).toHaveBeenCalledWith({
      featureId: "feature-1",
      page: 2,
      limit: 20,
      q: "봄",
      sort: "price",
      direction: "asc",
    });
  });
  it("존재하지 않는 기능이면 notFound를 호출한다", async () => {
    featureMock.mockResolvedValue([]);
    await expect(callPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(bindingsMock).not.toHaveBeenCalled();
  });
  it("기능 이름과 조회 결과를 템플릿에 전달한다", async () => {
    render(await callPage({ q: "봄" }));
    expect(screen.getByText("Template:갤러리 확대 보기:q=봄:0")).toBeInTheDocument();
  });
});
