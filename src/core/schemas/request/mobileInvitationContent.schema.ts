import * as z from "zod";

const ParentSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요."),
  phone: z.string().min(1, "연락처를 입력해주세요."),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
});

const CoupleSideSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요."),
  phone: z.string().min(1, "연락처를 입력해주세요."),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  father: ParentSchema.optional(),
  mother: ParentSchema.optional(),
});

// 서버·클라이언트가 동일하게 검증한다 — 이중 스키마로 나뉘어 서버가 더 느슨해지는
// 구조를 두지 않는다.
export const mobileInvitationContentSchema = z.object({
  groom: CoupleSideSchema,
  bride: CoupleSideSchema,
  weddingDate: z.string().min(1, "결혼식 날짜를 입력해주세요."),
  weddingTime: z.string().min(1, "결혼식 시간을 입력해주세요."),
  venue: z.string().min(1, "예식장명을 입력해주세요."),
  address: z.string().min(1, "주소를 입력해주세요."),
  addressDetail: z.string().min(1, "상세주소를 입력해주세요."),
  subwayStation: z.string().optional(),
  guestbookEnabled: z.boolean(),
  thumbnailImages: z
    .array(z.string().url("유효한 URL이어야 합니다."))
    .length(3, "썸네일은 정확히 3장이어야 합니다."),
  galleryImages: z.array(z.string().url("유효한 URL이어야 합니다.")),
});

export type MobileInvitationContentSchemaDto = z.infer<
  typeof mobileInvitationContentSchema
>;
