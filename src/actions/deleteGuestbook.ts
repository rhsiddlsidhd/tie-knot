"use server";

import type { APIResponse } from "@/core/domain";
import { parseDeleteGuestbookFormData } from "@/core/schemas";
import { deleteGuestbookWithPasswordService } from "@/services/guestbook";
import { actionError } from "@/boundary";
import { routes } from "@/core/domain";
import { revalidatePath } from "next/cache";

export const deleteGuestbook = async (
  _prev: null,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const parsed = parseDeleteGuestbookFormData(formData);

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
