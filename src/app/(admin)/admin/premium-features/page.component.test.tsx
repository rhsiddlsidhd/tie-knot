import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PremiumFeature } from "@/core/domain/premium-feature";

const { verifySessionMock, getAllPremiumFeatureServiceMock } = vi.hoisted(
  () => ({
    verifySessionMock: vi.fn(),
    getAllPremiumFeatureServiceMock: vi.fn(),
  }),
);

vi.mock("@/services/auth", () => ({
  verifySession: verifySessionMock,
}));
vi.mock("@/services/premiumFeature", () => ({
  getAllPremiumFeatureService: getAllPremiumFeatureServiceMock,
}));

vi.mock(
  "@/app/(admin)/admin/premium-features/_components/PremiumFeaturesTemplate",
  () => ({
    PremiumFeaturesTemplate: ({ features }: { features: PremiumFeature[] }) => (
      <div>템플릿:features={features.length}</div>
    ),
  }),
);

import PremiumFeaturesPage from "./page";

const feature: PremiumFeature = {
  _id: "feature-1",
  code: "GUESTBOOK",
  label: "방명록",
  description: "방명록 기능",
  additionalPrice: 3000,
  isActive: true,
  createdAt: new Date("2026-08-01T00:00:00.000Z").toISOString(),
};

describe("프리미엄 기능 목록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({
      role: "ADMIN",
      email: "a@x.com",
      userId: "1",
    });
    getAllPremiumFeatureServiceMock.mockResolvedValue([]);
  });

  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await PremiumFeaturesPage();

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });

  it("인증에 실패하면(verifySession이 throw) 목록 service를 호출하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(PremiumFeaturesPage()).rejects.toThrow();

    expect(getAllPremiumFeatureServiceMock).not.toHaveBeenCalled();
  });

  it("service가 반환한 목록을 Template props로 전달한다", async () => {
    getAllPremiumFeatureServiceMock.mockResolvedValue([feature]);

    render(await PremiumFeaturesPage());

    expect(screen.getByText("템플릿:features=1")).toBeInTheDocument();
  });
});
