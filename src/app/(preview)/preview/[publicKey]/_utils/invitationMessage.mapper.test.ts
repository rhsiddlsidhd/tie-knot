import { describe, expect, it } from "vitest";

import type { InvitationContent } from "@/core/domain";

import { mapCoupleInfoToInvitationProps } from "./invitationMessage.mapper";

const invitationContent: InvitationContent = {
  groom: {
    name: "신랑",
    phone: "010-0000-0001",
    father: { name: "김철수", phone: "010-1111-1111" },
    mother: { name: "이영희", phone: "010-2222-2222" },
  },
  bride: {
    name: "신부",
    phone: "010-0000-0002",
    father: { name: "박민수", phone: "010-3333-3333" },
    mother: { name: "최지은", phone: "010-4444-4444" },
  },
  weddingDate: new Date("2099-01-01"),
  venue: "예식장",
  address: "주소",
  addressDetail: "상세 주소",
  guestbookEnabled: true,
  thumbnailImages: [],
  galleryImages: [],
};

describe("초대 문구 매퍼", () => {
  it("부모 연락처 관계를 측과 존칭을 포함해 표시한다", () => {
    const { parties } = mapCoupleInfoToInvitationProps(invitationContent);

    expect(parties[0].contacts.map(({ relation }) => relation)).toEqual([
      "신랑측 아버님",
      "신랑측 어머님",
    ]);
    expect(parties[1].contacts.map(({ relation }) => relation)).toEqual([
      "신부측 아버님",
      "신부측 어머님",
    ]);
  });

  it("부모 이름 라벨에는 측 접두사 없이 존칭만 표시한다", () => {
    const { parties } = mapCoupleInfoToInvitationProps(invitationContent);

    expect(parties[0].parents.map(({ label }) => label)).toEqual([
      "아버님",
      "어머님",
    ]);
    expect(parties[1].parents.map(({ label }) => label)).toEqual([
      "아버님",
      "어머님",
    ]);
  });
});
