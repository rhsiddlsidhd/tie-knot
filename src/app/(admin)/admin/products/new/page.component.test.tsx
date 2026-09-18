import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PremiumFeature } from "@/core/domain/premium-feature";

const {
  verifySessionMock,
  getAllPremiumFeatureServiceMock,
  getSelectablePremiumFeatureServiceMock,
} = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
  getAllPremiumFeatureServiceMock: vi.fn(),
  getSelectablePremiumFeatureServiceMock: vi.fn(),
}));

vi.mock("@/services/auth", () => ({
  verifySession: verifySessionMock,
}));
vi.mock("@/services/premiumFeature", () => ({
  getAllPremiumFeatureService: getAllPremiumFeatureServiceMock,
  getSelectablePremiumFeatureService: getSelectablePremiumFeatureServiceMock,
}));

vi.mock(
  "@/app/(admin)/admin/products/new/_components/NewProductTemplate",
  () => ({
    NewProductTemplate: ({
      premiumFeatures,
    }: {
      premiumFeatures: PremiumFeature[];
    }) => <div>템플릿:premiumFeatures={premiumFeatures.length}</div>,
  }),
);

import NewProductPage from "./page";

const feature: PremiumFeature = {
  _id: "feature-1",
  code: "GUESTBOOK",
  label: "방명록",
  description: "방명록 기능",
  additionalPrice: 3000,
  isActive: true,
  createdAt: new Date("2026-08-01T00:00:00.000Z").toISOString(),
};

describe("상품 등록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({
      role: "ADMIN",
      email: "a@x.com",
      userId: "1",
    });
    getAllPremiumFeatureServiceMock.mockResolvedValue([]);
    getSelectablePremiumFeatureServiceMock.mockResolvedValue([]);
  });

  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await NewProductPage();

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });

  it("인증에 실패하면(verifySession이 throw) 프리미엄 기능 목록 service를 호출하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(NewProductPage()).rejects.toThrow();

    expect(getSelectablePremiumFeatureServiceMock).not.toHaveBeenCalled();
  });

  it("service가 반환한 프리미엄 기능 목록을 Template props로 전달한다", async () => {
    getSelectablePremiumFeatureServiceMock.mockResolvedValue([feature]);

    render(await NewProductPage());

    expect(screen.getByText("템플릿:premiumFeatures=1")).toBeInTheDocument();
  });

  // 등록 중단(isActive: false)된 기능이 신규 상품 선택지에 남지 않게 하는 지점이다.
  // 전체 목록(getAllPremiumFeatureService)은 고객 필터와 상품 수정 다이얼로그가
  // 계속 써야 하므로 이 경로에서만 좁힌다.
  it("전체 목록이 아니라 등록 가능한 기능만 조회한다", async () => {
    await NewProductPage();

    expect(getSelectablePremiumFeatureServiceMock).toHaveBeenCalledTimes(1);
    expect(getAllPremiumFeatureServiceMock).not.toHaveBeenCalled();
  });
});
