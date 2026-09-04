import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/core/domain/error";

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

vi.mock("@/services/mobile-invitation", () => ({
  mobileInvitationCacheTag: (publicKey: string) => `mobile-invitation:${publicKey}`,
  setMobileInvitationStatusForCurrentUser: vi.fn(),
}));

import { setMobileInvitationStatusForCurrentUser } from "@/services/mobile-invitation";
import { setMobileInvitationStatus } from "./setMobileInvitationStatus";

describe("setMobileInvitationStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("성공하면 publicKey와 status를 리턴한다", async () => {
    vi.mocked(setMobileInvitationStatusForCurrentUser).mockResolvedValue({
      publicKey: "pub-1",
      status: "published",
    });

    const result = await setMobileInvitationStatus("order-1", "published");

    expect(result).toEqual({
      success: true,
      data: { publicKey: "pub-1", status: "published" },
    });
  });

  it("서비스가 실패하면 실패 응답으로 변환한다", async () => {
    vi.mocked(setMobileInvitationStatusForCurrentUser).mockRejectedValue(
      new AppError("NOT_FOUND", "청첩장을 찾을 수 없습니다."),
    );

    const result = await setMobileInvitationStatus("order-1", "published");

    expect(result.success).toBe(false);
  });
});
