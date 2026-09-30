import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { verifySessionMock, featureMock, notFoundMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
  featureMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("@/services/auth", () => ({ verifySession: verifySessionMock }));
vi.mock("@/services/premiumFeature", () => ({
  getPremiumFeatureService: featureMock,
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock(
  "@/app/(admin)/admin/premium-features/[id]/products/_containers/FeatureProductBindingTable",
  () => ({
    FeatureProductBindingTable: ({
      featureId,
      featureLabel,
    }: {
      featureId: string;
      featureLabel: string;
    }) => <div>{`테이블:${featureId}:${featureLabel}`}</div>,
  }),
);

import FeatureProductsPage from "./page";

const callPage = () =>
  FeatureProductsPage({ params: Promise.resolve({ id: "feature-1" }) });

describe("기능별 연결 상품 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({ role: "ADMIN" });
    featureMock.mockResolvedValue([
      { _id: "feature-1", label: "갤러리 확대 보기" },
    ]);
  });

  it("ADMIN 권한을 확인한 뒤 기능 id로 기능을 조회한다", async () => {
    await callPage();

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
    expect(featureMock).toHaveBeenCalledWith(["feature-1"]);
  });

  it("기능 id와 이름을 테이블에 전달한다", async () => {
    render(await callPage());

    expect(
      screen.getByText("테이블:feature-1:갤러리 확대 보기"),
    ).toBeInTheDocument();
  });

  it("기능이 없으면 notFound를 호출한다", async () => {
    featureMock.mockResolvedValue([]);

    await expect(callPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it("인증에 실패하면(verifySession이 throw) 기능을 조회하지 않는다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(callPage()).rejects.toThrow("redirect");
    expect(featureMock).not.toHaveBeenCalled();
  });
});
