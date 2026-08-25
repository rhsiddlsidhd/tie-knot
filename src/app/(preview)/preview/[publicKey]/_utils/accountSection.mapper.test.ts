import { describe, expect, it } from "vitest";

import type { InvitationContent } from "@/core/domain";

import { mapCoupleInfoToAccountProps } from "./accountSection.mapper";

const invitationContent = {
  groom: {
    name: "신랑",
    father: {
      name: "김철수",
      bankName: "은행",
      accountNumber: "1",
    },
    mother: {
      name: "이영희",
      bankName: "은행",
      accountNumber: "2",
    },
  },
  bride: {
    name: "신부",
    father: {
      name: "박민수",
      bankName: "은행",
      accountNumber: "3",
    },
    mother: {
      name: "최지은",
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
} satisfies InvitationContent;

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
