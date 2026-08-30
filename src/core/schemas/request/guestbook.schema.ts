import * as z from "zod";
import { validateAndFlatten } from "@/core/utils";

export const GuestbookSchema = z.object({
  publicKey: z.string().min(1, "청첩장 공개 키가 필요합니다"),
  author: z
    .string()
    .min(1, "작성자 이름을 입력해주세요")
    .max(20, "이름은 20자 이내로 입력해주세요"),
  password: z
    .string()
    .min(4, "비밀번호는 최소 4자 이상이어야 합니다")
    .max(20, "비밀번호는 20자 이내로 입력해주세요"),
  message: z
    .string()
    .min(1, "메시지를 입력해주세요")
    .max(500, "메시지는 500자 이내로 입력해주세요"),
  isPrivate: z.boolean(),
});

export type GuestbookType = z.infer<typeof GuestbookSchema>;

export const deleteGuestbookSchema = GuestbookSchema.pick({ password: true }).extend({
  guestbookId: z.string().min(1, "게시글 ID가 필요합니다."),
  publicKey: z.string().min(1, "청첩장 공개 키가 필요합니다."),
});

export type DeleteGuestbookType = z.infer<typeof deleteGuestbookSchema>;

// createGuestbook 실제 Server Action과 데모(로컬 상태) 작성 경로가 같은 FormData
// shape을 공유하므로, 파싱+검증을 여기 한 곳에 모아 두 경로가 어긋나지 않게 한다.
export const parseGuestbookFormData = (formData: FormData) =>
  validateAndFlatten(GuestbookSchema, {
    publicKey: formData.get("publicKey") as string,
    author: formData.get("author") as string,
    password: formData.get("password") as string,
    message: formData.get("message") as string,
    isPrivate: formData.get("isPrivate") === "true",
  });

// deleteGuestbook 실제 Server Action과 데모 삭제 경로가 같은 FormData shape을
// 공유하므로, 파싱+검증을 여기 한 곳에 모아 둔다.
export const parseDeleteGuestbookFormData = (formData: FormData) =>
  validateAndFlatten(deleteGuestbookSchema, {
    password: formData.get("password") as string,
    guestbookId: formData.get("guestbookId") as string,
    publicKey: formData.get("publicKey") as string,
  });
