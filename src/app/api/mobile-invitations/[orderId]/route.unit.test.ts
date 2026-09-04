// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/core/domain/error";

vi.mock("@/services/auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/services/mobile-invitation", () => ({
  getOwnedMobileInvitationByOrder: vi.fn(),
}));

import { requireAuth } from "@/services/auth";
import { getOwnedMobileInvitationByOrder } from "@/services/mobile-invitation";
import { GET } from "./route";

const buildParams = (orderId: string) => ({ params: Promise.resolve({ orderId }) });

describe("GET /api/invitations/[orderId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("인증되지 않으면 실패 응답을 리턴한다", async () => {
    vi.mocked(requireAuth).mockRejectedValue(
      new AppError("UNAUTHENTICATED", "로그인이 필요합니다."),
    );

    const res = await GET(new Request("http://localhost"), buildParams("order-1"));
    const body = await res.json();

    expect(body.success).toBe(false);
    expect(getOwnedMobileInvitationByOrder).not.toHaveBeenCalled();
  });

  it("청첩장이 없으면 data null을 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "u1",
    });
    vi.mocked(getOwnedMobileInvitationByOrder).mockResolvedValue(null);

    const res = await GET(new Request("http://localhost"), buildParams("order-1"));
    const body = await res.json();

    expect(body).toEqual({ success: true, data: null });
  });

  it("청첩장이 있으면 theme을 포함한 콘텐츠를 리턴한다", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      role: "USER",
      email: "a@b.com",
      userId: "u1",
    });
    vi.mocked(getOwnedMobileInvitationByOrder).mockResolvedValue({
      publicKey: "pub-1",
      status: "draft",
      groom: { name: "신랑", phone: "010-0000-0001" },
      bride: { name: "신부", phone: "010-0000-0002" },
      weddingDate: new Date("2099-01-01"),
      venue: "예식장",
      address: "주소",
      addressDetail: "상세",
      guestbookEnabled: true,
      thumbnailImages: [],
      galleryImages: [],
      theme: "blossom",
    } as never);

    const res = await GET(new Request("http://localhost"), buildParams("order-1"));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.theme).toBe("blossom");
  });
});
