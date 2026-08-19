import type { InvitationContent } from "@/core/domain";

export const sampleInvitation = {
  groom: { name: "민준", phone: "010-1234-5678" },
  bride: { name: "서연", phone: "010-9876-5432" },
  weddingDate: new Date("2099-05-22T13:00:00+09:00"),
  venue: "타이노트 웨딩홀",
  address: "서울특별시 중구 세종대로 110",
  addressDetail: "그랜드홀 2층",
  subwayStation: "시청역",
  guestbookEnabled: false,
  thumbnailImages: [
    "/assets/images/output.webp",
    "/assets/images/output.webp",
    "/assets/images/output.webp",
  ],
  galleryImages: ["/assets/images/output.webp"],
} satisfies InvitationContent;

export const SAMPLE_FEATURES = [] as const;
export const SAMPLE_THEME = "default";
