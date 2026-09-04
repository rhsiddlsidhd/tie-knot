import { describe, it, expect } from "vitest";
import { mobileInvitationContentSchema } from "./mobileInvitationContent.schema";

const validPerson = { name: "신랑", phone: "010-0000-0001" };

const buildInput = (thumbnailImages: string[]): Record<string, unknown> => ({
  groom: validPerson,
  bride: validPerson,
  weddingDate: "2099-01-01",
  weddingTime: "13:00",
  venue: "예식장",
  address: "주소",
  addressDetail: "상세 주소",
  guestbookEnabled: true,
  thumbnailImages,
  galleryImages: [],
});

const THUMB = "https://example.com/thumb.jpg";

describe("mobileInvitationContentSchema", () => {
  it("썸네일이 정확히 3장이면 통과한다", () => {
    const result = mobileInvitationContentSchema.safeParse(
      buildInput([THUMB, THUMB, THUMB]),
    );

    expect(result.success).toBe(true);
  });

  it("썸네일이 0장이면 실패한다", () => {
    const result = mobileInvitationContentSchema.safeParse(buildInput([]));

    expect(result.success).toBe(false);
  });

  it("썸네일이 1장이면 실패한다", () => {
    const result = mobileInvitationContentSchema.safeParse(buildInput([THUMB]));

    expect(result.success).toBe(false);
  });

  it("썸네일이 4장이면 실패한다", () => {
    const result = mobileInvitationContentSchema.safeParse(
      buildInput([THUMB, THUMB, THUMB, THUMB]),
    );

    expect(result.success).toBe(false);
  });

  it("계좌 정보가 없어도 통과한다 (선택 입력)", () => {
    const result = mobileInvitationContentSchema.safeParse(
      buildInput([THUMB, THUMB, THUMB]),
    );

    expect(result.success).toBe(true);
  });
});
