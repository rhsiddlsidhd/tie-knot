"use server";

import type { ApiResponse } from "@/core/domain/error";
import { parseGuestbookFormData } from "@/core/schemas/request/guestbook.schema";
import { createGuestbookWithPasswordService } from "@/services/guestbook";
import { actionError } from "@/boundary";
import { ROUTES } from "@/core/domain/routes";
import { revalidatePath } from "next/cache";

const createGuestbook = async (
  _prev: null,
  formData: FormData,
): Promise<ApiResponse<{ message: string }>> => {
  const parsed = parseGuestbookFormData(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력값을 확인해주세요",
        fieldErrors: parsed.error,
      },
    };
  }

  try {
    await createGuestbookWithPasswordService(parsed.data);

    revalidatePath(ROUTES.preview.detail(parsed.data.publicKey));

    return {
      success: true,
      data: { message: "방명록 작성이 완료되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};

export { createGuestbook };
