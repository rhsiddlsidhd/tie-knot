import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { verifySessionMock } = vi.hoisted(() => ({
  verifySessionMock: vi.fn(),
}));

vi.mock("@/services/auth", () => ({
  verifySession: verifySessionMock,
}));

vi.mock(
  "@/app/(admin)/admin/premium-features/new/_components/NewPremiumFeatureTemplate",
  () => ({
    NewPremiumFeatureTemplate: () => <div>새-프리미엄-기능-템플릿</div>,
  }),
);

import NewPremiumFeaturePage from "./page";

describe("프리미엄 기능 등록 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySessionMock.mockResolvedValue({
      role: "ADMIN",
      email: "a@x.com",
      userId: "1",
    });
  });

  it("ADMIN 권한으로 verifySession을 호출한다", async () => {
    await NewPremiumFeaturePage();

    expect(verifySessionMock).toHaveBeenCalledWith("ADMIN");
  });

  it("인증에 성공하면 등록 Template을 렌더링한다", async () => {
    render(await NewPremiumFeaturePage());

    expect(screen.getByText("새-프리미엄-기능-템플릿")).toBeInTheDocument();
  });

  it("인증에 실패하면(verifySession이 throw) 렌더링하지 않고 그대로 전파한다", async () => {
    verifySessionMock.mockRejectedValue(new Error("redirect"));

    await expect(NewPremiumFeaturePage()).rejects.toThrow("redirect");
  });
});
