import type { InvitationContent } from "@/core/domain";

export const sampleInvitation = {
  groom: {
    name: "민준",
    phone: "010-1234-5678",
    bankName: "KOOKMIN",
    accountNumber: "123456-78-901234",
    father: { name: "김철수", phone: "010-1111-2222", bankName: "WOORI", accountNumber: "1002-333-444555" },
    mother: { name: "이영희", phone: "010-3333-4444", bankName: "NONGHYUP", accountNumber: "302-5566-7788-01" },
  },
  bride: {
    name: "서연",
    phone: "010-9876-5432",
    bankName: "SHINHAN",
    accountNumber: "987654-32-109876",
    father: { name: "박민수", phone: "010-5555-6666", bankName: "HANA", accountNumber: "111-222222-33344" },
    mother: { name: "최지은", phone: "010-7777-8888", bankName: "KOOKMIN", accountNumber: "555-01-666777" },
  },
  weddingDate: new Date("2099-05-22T13:00:00+09:00"),
  venue: "타이노트 웨딩홀",
  address: "서울특별시 중구 세종대로 110",
  addressDetail: "그랜드홀 2층",
  subwayStation: "시청",
  guestbookEnabled: true,
  thumbnailImages: [
    "/assets/images/output.webp",
    "/assets/images/output.webp",
    "/assets/images/output.webp",
  ],
  galleryImages: ["/assets/images/output.webp"],
} satisfies InvitationContent;

export const SAMPLE_FEATURES = ["HORIZONTAL_SLIDE"] as const;
export const SAMPLE_THEME = "blossom";
