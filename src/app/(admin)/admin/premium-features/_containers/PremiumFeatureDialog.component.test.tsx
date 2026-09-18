import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PremiumFeature } from "@/core/domain/premium-feature";

vi.mock("@/actions/updatePremiumFeature", () => ({
  updatePremiumFeature: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { updatePremiumFeature } from "@/actions/updatePremiumFeature";
import { toast } from "sonner";
import { PremiumFeatureDialog } from "./PremiumFeatureDialog";

const feature: PremiumFeature = {
  _id: "feature-1",
  code: "GUESTBOOK",
  label: "방명록",
  description: "방명록 기능",
  additionalPrice: 3000,
  isActive: true,
  createdAt: new Date("2026-08-01T00:00:00.000Z").toISOString(),
};

describe("PremiumFeatureDialog (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("수정에 성공하면 성공 메시지를 toast로 표시한다", async () => {
    vi.mocked(updatePremiumFeature).mockResolvedValue({
      success: true,
      data: { message: "프리미엄 기능이 수정되었습니다." },
    });
    const user = userEvent.setup();
    render(<PremiumFeatureDialog premiumFeature={feature} />);

    await user.click(screen.getByRole("button", { name: "수정" }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("프리미엄 기능이 수정되었습니다."),
    );
  });

  it("필드 에러 없는 실패면 에러 메시지를 toast로 표시한다", async () => {
    vi.mocked(updatePremiumFeature).mockResolvedValue({
      success: false,
      error: { category: "INTERNAL", message: "알 수 없는 오류가 발생했습니다." },
    });
    const user = userEvent.setup();
    render(<PremiumFeatureDialog premiumFeature={feature} />);

    await user.click(screen.getByRole("button", { name: "수정" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("알 수 없는 오류가 발생했습니다."),
    );
  });

  it("필드 에러가 있는 실패면 toast 대신 필드 에러를 인라인으로 표시한다", async () => {
    vi.mocked(updatePremiumFeature).mockResolvedValue({
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력값을 확인해주세요",
        fieldErrors: { label: ["기능 이름을 입력해주세요."] },
      },
    });
    const user = userEvent.setup();
    render(<PremiumFeatureDialog premiumFeature={feature} />);

    await user.click(screen.getByRole("button", { name: "수정" }));

    expect(
      await screen.findByText("기능 이름을 입력해주세요."),
    ).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
