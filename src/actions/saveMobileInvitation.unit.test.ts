import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

vi.mock("@/services/mobile-invitation", () => ({
  mobileInvitationCacheTag: (publicKey: string) => `mobile-invitation:${publicKey}`,
  saveMobileInvitationForCurrentUser: vi.fn(),
}));

import { saveMobileInvitationForCurrentUser } from "@/services/mobile-invitation";
import { saveMobileInvitation } from "./saveMobileInvitation";

const THUMB = "https://example.com/thumb.jpg";

const buildFormData = (overrides: Record<string, string> = {}) => {
  const formData = new FormData();
  const fields: Record<string, string> = {
    orderId: "order-1",
    groom_name: "신랑",
    groom_phone: "010-0000-0001",
    groom_bank_name: "",
    groom_account_number: "",
    bride_name: "신부",
    bride_phone: "010-0000-0002",
    bride_bank_name: "",
    bride_account_number: "",
    wedding_date: "2099-01-01",
    wedding_time: "13:00",
    venue_name: "예식장",
    venue_address: "주소",
    venue_address_detail: "상세",
    subway_station: "",
    thumbnailSource: JSON.stringify([THUMB, THUMB, THUMB]),
    gallerySource: JSON.stringify([]),
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
};

describe("saveMobileInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("썸네일이 3장이 아니면 VALIDATION 에러를 리턴한다", async () => {
    const formData = buildFormData({ thumbnailSource: JSON.stringify([THUMB]) });

    const result = await saveMobileInvitation(null, formData);

    expect(result.success).toBe(false);
    if (result.success === false) {
      expect(result.error.category).toBe("VALIDATION");
    }
    expect(saveMobileInvitationForCurrentUser).not.toHaveBeenCalled();
  });

  it("orderId가 없으면 VALIDATION 에러를 리턴한다", async () => {
    const formData = buildFormData({ orderId: "" });

    const result = await saveMobileInvitation(null, formData);

    expect(result.success).toBe(false);
    expect(saveMobileInvitationForCurrentUser).not.toHaveBeenCalled();
  });

  it("정상 입력이면 저장하고 publicKey를 리턴한다", async () => {
    vi.mocked(saveMobileInvitationForCurrentUser).mockResolvedValue({
      publicKey: "pub-1",
    } as never);
    const formData = buildFormData();

    const result = await saveMobileInvitation(null, formData);

    expect(result).toEqual({
      success: true,
      data: {
        message: "청첩장이 성공적으로 저장되었습니다.",
        publicKey: "pub-1",
      },
    });
  });
});
