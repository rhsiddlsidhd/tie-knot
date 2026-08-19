"use server";

import type { APIResponse } from "@/core/domain";
import { validateAndFlatten } from "@/core/utils";
import { GuestbookSchema } from "@/core/schemas";
import { deleteGuestbookWithPasswordService } from "@/services";
import { actionError } from "@/boundary";
import { routes } from "@/core/domain";
import * as z from "zod";
import { revalidatePath } from "next/cache";

export const deleteGuestbook = async (
  _prev: null,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const data = {
    password: formData.get("password") as string,
    guestbookId: formData.get("guestbookId") as string,
    publicKey: formData.get("publicKey") as string,
  };
  const passwordSchema = GuestbookSchema.pick({ password: true }).extend({
    guestbookId: z.string().min(1, "게시글 ID가 필요합니다."),
    publicKey: z.string().min(1, "청첩장 공개 키가 필요합니다."),
  });
  const parsed = validateAndFlatten(passwordSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        category: "VALIDATION",
        message: "비밀번호 또는 게시글 ID 형식이 올바르지 않습니다.",
        fieldErrors: parsed.error,
      },
    };
  }

  try {
    await deleteGuestbookWithPasswordService(parsed.data);

    revalidatePath(routes.preview.detail(parsed.data.publicKey));

    return {
      success: true,
      data: { message: "게시글이 성공적으로 삭제되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};
