"use server";

import type { APIResponse } from "@/core/domain/error";
import { parseGuestbookFormData } from "@/core/schemas/request/guestbook.schema";
import { createGuestbookWithPasswordService } from "@/services/guestbook";
import { actionError } from "@/boundary";
import { routes } from "@/core/domain/routes";
import { revalidatePath } from "next/cache";

export const createGuestbook = async (
  _prev: null,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const parsed = parseGuestbookFormData(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: { category: "VALIDATION", message: "입력값을 확인해주세요", fieldErrors: parsed.error },
    };
  }

  try {
    await createGuestbookWithPasswordService(parsed.data);

    revalidatePath(routes.preview.detail(parsed.data.publicKey));

    return {
      success: true,
      data: { message: "방명록 작성이 완료되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};
