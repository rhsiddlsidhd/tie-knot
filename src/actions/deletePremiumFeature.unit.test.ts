import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/core/domain/error";
import { ROUTES } from "@/core/domain/routes";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/services/premiumFeature", () => ({
  deletePremiumFeatureAsAdminService: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { deletePremiumFeatureAsAdminService } from "@/services/premiumFeature";
import { deletePremiumFeature } from "./deletePremiumFeature";

describe("deletePremiumFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("삭제에 성공하면 완료 메시지를 리턴한다", async () => {
    vi.mocked(deletePremiumFeatureAsAdminService).mockResolvedValue(undefined);

    const result = await deletePremiumFeature("feature-1");

    expect(deletePremiumFeatureAsAdminService).toHaveBeenCalledWith(
      "feature-1",
    );
    expect(result).toEqual({
      success: true,
      data: { message: "프리미엄 기능이 삭제되었습니다." },
    });
  });

  it("삭제에 성공하면 관리자 목록 경로를 재검증한다", async () => {
    vi.mocked(deletePremiumFeatureAsAdminService).mockResolvedValue(undefined);

    await deletePremiumFeature("feature-1");

    expect(revalidatePath).toHaveBeenCalledWith(
      ROUTES.admin.premiumFeatures.root,
    );
  });

  it("서비스가 실패하면 실패 응답으로 변환하고 재검증하지 않는다", async () => {
    vi.mocked(deletePremiumFeatureAsAdminService).mockRejectedValue(
      new AppError("VALIDATION", "이 기능을 사용 중인 상품이 있습니다."),
    );

    const result = await deletePremiumFeature("feature-1");

    expect(result.success).toBe(false);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("실패 응답에 서비스가 던진 메시지를 담는다", async () => {
    vi.mocked(deletePremiumFeatureAsAdminService).mockRejectedValue(
      new AppError("VALIDATION", "이 기능을 사용 중인 상품이 있습니다."),
    );

    const result = await deletePremiumFeature("feature-1");

    expect(result.success === false && result.error.message).toBe(
      "이 기능을 사용 중인 상품이 있습니다.",
    );
  });
});
