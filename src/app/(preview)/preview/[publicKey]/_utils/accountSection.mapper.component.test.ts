import { describe, expect, it } from "vitest";

import type { InvitationContent } from "@/core/domain/invitation";

import { mapCoupleInfoToAccountProps } from "./accountSection.mapper";

const invitationContent: InvitationContent = {
  groom: {
    name: "신랑",
    phone: "010-0000-0001",
    father: {
      name: "김철수",
      phone: "010-1111-1111",
      bankName: "은행",
      accountNumber: "1",
    },
    mother: {
      name: "이영희",
      phone: "010-2222-2222",
      bankName: "은행",
      accountNumber: "2",
    },
  },
  bride: {
    name: "신부",
    phone: "010-0000-0002",
    father: {
      name: "박민수",
      phone: "010-3333-3333",
      bankName: "은행",
      accountNumber: "3",
    },
    mother: {
      name: "최지은",
      phone: "010-4444-4444",
      bankName: "은행",
      accountNumber: "4",
    },
  },
  weddingDate: new Date("2099-01-01"),
  venue: "예식장",
  address: "주소",
  addressDetail: "상세 주소",
  guestbookEnabled: true,
  thumbnailImages: [],
  galleryImages: [],
};

describe("계좌 정보 매퍼", () => {
  it("부모 계좌 관계를 측과 존칭을 포함해 표시한다", () => {
    const result = mapCoupleInfoToAccountProps(invitationContent);

    expect(result.groomAccounts.map(({ relation }) => relation)).toEqual([
      "신랑측 아버님",
      "신랑측 어머님",
    ]);
    expect(result.brideAccounts.map(({ relation }) => relation)).toEqual([
      "신부측 아버님",
      "신부측 어머님",
    ]);
  });
});
