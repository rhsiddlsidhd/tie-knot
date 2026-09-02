"use server";

import { validateAndFlatten } from "@/core/utils";
import { PWConfirmSchema } from "@/core/schemas";
import type { APIResponse } from "@/core/domain";
import { resetUserPasswordService } from "@/services/user";
import { actionError } from "@/boundary";

// 유저가 비밀번호를 기억하지 못할 때 로그인하지 않은 상태에서 이메일로 비밀번호 변경
export const updateUserPassword = async (
  prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> => {
  const data = {
    token: formData.get("token") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = validateAndFlatten(PWConfirmSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력한 정보가 올바르지 않습니다. 다시 확인해주세요.",
        fieldErrors: parsed.error,
      },
    };
  }

  try {
    await resetUserPasswordService(parsed.data);
    return {
      success: true,
      data: { message: "비밀번호가 성공적으로 변경되었습니다." },
    };
  } catch (e) {
    return actionError(e);
  }
};
