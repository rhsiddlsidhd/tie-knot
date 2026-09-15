import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AdminPremiumFeatureListPage } from "@/core/domain/premium-feature";

const { verifySessionMock, getAdminPremiumFeaturesPageServiceMock } =
  vi.hoisted(() => ({
    verifySessionMock: vi.fn(),
    getAdminPremiumFeaturesPageServiceMock: vi.fn(),
  }));

vi.mock("@/services/auth", () => ({
  verifySession: verifySessionMock,
}));
vi.mock("@/services/premiumFeature", () => ({
  getAdminPremiumFeaturesPageService: getAdminPremiumFeaturesPageServiceMock,
}));

vi.mock(
  "@/app/(admin)/admin/premium-features/_components/PremiumFeaturesTemplate",
  () => ({
    PremiumFeaturesTemplate: ({
      page,
      cursor,
    }: {
      page: AdminPremiumFeatureListPage;
      cursor?: string;
    }) => (
      <div>
        템플릿:features={page.items.length}:cursor={cursor ?? "none"}
      </div>
    ),
  }),
);

import PremiumFeaturesPage from "./page";

const emptyPage: AdminPremiumFeatureListPage = { items: [], nextCursor: null };

const page: AdminPremiumFeatureListPage = {
  items: [
    {
      _id: "feature-1",
      code: "GUESTBOOK",
      label: "방명록",
      description: "방명록 기능",
      additionalPrice: 3000,
      isActive: true,
      createdAt: new Date("2026-08-01T00:00:00.000Z").toISOString(),
    },
  ],
  nextCursor: null,
};

const buildSearchParams = (
  params: Record<string, string | string[] | undefined> = {},
) => Promise.resolve(params);

describe("프리미엄 기능 목록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({
      role: "ADMIN",
      email: "a@x.com",
      userId: "1",
    });
    getAdminPremiumFeaturesPageServiceMock.mockResolvedValue(emptyPage);
  });

  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await PremiumFeaturesPage({ searchParams: buildSearchParams() });

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });

  it("인증에 실패하면(verifySession이 throw) 목록 service를 호출하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(
      PremiumFeaturesPage({ searchParams: buildSearchParams() }),
    ).rejects.toThrow();

    expect(getAdminPremiumFeaturesPageServiceMock).not.toHaveBeenCalled();
  });

  it("service가 반환한 페이지를 Template props로 전달한다", async () => {
    getAdminPremiumFeaturesPageServiceMock.mockResolvedValue(page);

    render(await PremiumFeaturesPage({ searchParams: buildSearchParams() }));

    expect(
      screen.getByText("템플릿:features=1:cursor=none"),
    ).toBeInTheDocument();
  });

  it("형식이 올바른 cursor는 service와 Template에 그대로 넘긴다", async () => {
    const cursor = btoa("2026-08-01T00:00:00.000Z|507f1f77bcf86cd799439011")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    render(
      await PremiumFeaturesPage({
        searchParams: buildSearchParams({ cursor }),
      }),
    );

    expect(getAdminPremiumFeaturesPageServiceMock).toHaveBeenCalledWith({
      cursor,
    });
    expect(
      screen.getByText(`템플릿:features=0:cursor=${cursor}`),
    ).toBeInTheDocument();
  });

  it("형식이 깨진 cursor는 커서 없음으로 떨어뜨린다", async () => {
    await PremiumFeaturesPage({
      searchParams: buildSearchParams({ cursor: "!!!broken!!!" }),
    });

    expect(getAdminPremiumFeaturesPageServiceMock).toHaveBeenCalledWith({
      cursor: undefined,
    });
  });
});
