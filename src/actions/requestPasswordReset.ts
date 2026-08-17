"use server";

import { validateAndFlatten } from "@/core/utils";
import { emailSchema } from "@/core/schemas";
import type { APIResponse } from "@/core/domain";
import { requestPasswordResetService } from "@/services";
import { actionError } from "@/boundary";

export const requestPasswordReset = async (
  prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string; email: string }>> => {
  // 이메일 비밀번호 재설정 링크 전송
  // nodeMailer 라이브러리 사용

  const data = {
    email: formData.get("email") as string,
  };

  const parsed = validateAndFlatten(emailSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력 값을 확인해주세요.",
        fieldErrors: parsed.error,
      },
    };
  }
  const { email } = parsed.data;

  try {
    await requestPasswordResetService(email);

    return {
      success: true,
      data: { message: "이메일 발송에 성공하였습니다.", email },
    };
  } catch (e) {
    return actionError(e);
  }
};
