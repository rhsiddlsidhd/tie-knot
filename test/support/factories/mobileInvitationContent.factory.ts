import mongoose from "mongoose";
import type { MobileInvitationContentSchemaDto } from "@/core/schemas/request/mobileInvitationContent.schema";

export const buildMobileInvitationContentInput = (
  overrides?: Partial<MobileInvitationContentSchemaDto & { userId: string }>,
): MobileInvitationContentSchemaDto & { userId: string } => ({
  userId: new mongoose.Types.ObjectId().toString(),
  groom: { name: "김철수", phone: "010-1111-2222" },
  bride: { name: "이영희", phone: "010-3333-4444" },
  weddingDate: "2026-12-25",
  weddingTime: "13:00",
  venue: "그랜드 웨딩홀",
  address: "서울시 강남구",
  addressDetail: "3층",
  guestbookEnabled: true,
  thumbnailImages: [
    "https://example.com/thumbnail-1.jpg",
    "https://example.com/thumbnail-2.jpg",
    "https://example.com/thumbnail-3.jpg",
  ],
  galleryImages: ["https://example.com/gallery.jpg"],
  ...overrides,
});
