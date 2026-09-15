import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { FeatureProductBindingPage } from "@/core/domain/premium-feature";

const {
  verifySessionMock,
  getPremiumFeatureServiceMock,
  getFeatureProductBindingsPageServiceMock,
  notFoundMock,
} = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
  getPremiumFeatureServiceMock: vi.fn(),
  getFeatureProductBindingsPageServiceMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/services/auth", () => ({ verifySession: verifySessionMock }));
vi.mock("@/services/premiumFeature", () => ({
  getPremiumFeatureService: getPremiumFeatureServiceMock,
}));
vi.mock("@/services/product", () => ({
  getFeatureProductBindingsPageService:
    getFeatureProductBindingsPageServiceMock,
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
      page: FeatureProductBindingPage;
    }) => <div>{`Template:${featureLabel}:q=${q ?? ""}:${page.items.length}`}</div>,
  }),
);

import { encodeCursor } from "@/core/utils/cursor";
import FeatureProductsPage from "./page";

const feature = {
  _id: "feature-1",
  code: "GALLERY_LIGHTBOX",
  label: "갤러리 확대 보기",
  description: "설명",
  additionalPrice: 3000,
  isActive: true,
  createdAt: new Date("2026-08-01T00:00:00.000Z").toISOString(),
};

const emptyPage: FeatureProductBindingPage = { items: [], nextCursor: null };

const callPage = (searchParams: Record<string, string> = {}) =>
  FeatureProductsPage({
    params: Promise.resolve({ id: "feature-1" }),
    searchParams: Promise.resolve(searchParams),
  });

describe("기능별 연결 상품 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({ role: "ADMIN" });
    getPremiumFeatureServiceMock.mockResolvedValue([feature]);
    getFeatureProductBindingsPageServiceMock.mockResolvedValue(emptyPage);
  });

  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await callPage();

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });

  it("존재하지 않는 기능이면 notFound를 호출한다", async () => {
    getPremiumFeatureServiceMock.mockResolvedValue([]);

    await expect(callPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getFeatureProductBindingsPageServiceMock).not.toHaveBeenCalled();
  });

  it("검색어와 커서를 서비스에 그대로 넘긴다", async () => {
    const cursor = encodeCursor({
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      id: "507f1f77bcf86cd799439011",
    });

    await callPage({ q: "봄맞이", cursor });

    expect(getFeatureProductBindingsPageServiceMock).toHaveBeenCalledWith({
      featureId: "feature-1",
      q: "봄맞이",
      cursor,
    });
  });

  // 커서는 URL이 소유하므로 깨진 값이 와도 throw하지 않고 첫 페이지로 떨어뜨린다.
  it("형식이 깨진 커서는 버리고 검색어만 넘긴다", async () => {
    await callPage({ q: "봄맞이", cursor: "!!!broken!!!" });

    expect(getFeatureProductBindingsPageServiceMock).toHaveBeenCalledWith({
      featureId: "feature-1",
      q: "봄맞이",
      cursor: undefined,
    });
  });

  it("빈 검색어는 조건 없음으로 정규화해 넘긴다", async () => {
    await callPage({ q: "   " });

    expect(getFeatureProductBindingsPageServiceMock).toHaveBeenCalledWith({
      featureId: "feature-1",
      q: undefined,
      cursor: undefined,
    });
  });

  it("기능 이름과 조회 결과를 Template에 전달한다", async () => {
    render(await callPage({ q: "봄맞이" }));

    expect(
      screen.getByText("Template:갤러리 확대 보기:q=봄맞이:0"),
    ).toBeInTheDocument();
  });
});
