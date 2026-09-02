"use server";

import type { APIResponse } from "@/core/domain";

import { validateAndFlatten } from "@/core/utils";
import { LoginSchema } from "@/core/schemas";
import { loginUserService } from "@/services/auth";
import type { UserRole } from "@/core/domain";
import { actionError } from "@/boundary";

export const loginUser = async (
  _prev: null,
  formData: FormData,
): Promise<APIResponse<{ role: UserRole; email: string; userId: string }>> => {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    remember: formData.get("remember") ? true : false,
  };

  if (!data.email || !data.password) {
    return {
      success: false,
      error: { category: "VALIDATION", message: "아이디와 비밀번호를 확인해주세요." },
    };
  }

  const parsed = validateAndFlatten(LoginSchema, data);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력하신 정보의 형식이 올바르지 않습니다.",
        fieldErrors: parsed.error,
      },
    };
  }

  try {
    return { success: true, data: await loginUserService(parsed.data) };
  } catch (e) {
    return actionError(e);
  }
};
