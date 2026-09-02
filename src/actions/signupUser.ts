"use server";

import type { APIResponse } from "@/core/domain";

import { validateAndFlatten } from "@/core/utils";
import { RegisterSchema } from "@/core/schemas";
import { signupUserService } from "@/services/user";
import { actionError } from "@/boundary";
export async function signupUser(
  prev: unknown,
  formData: FormData,
): Promise<APIResponse<{ message: string }>> {
  const data = {
    email: formData.get("email") as string,
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = validateAndFlatten(RegisterSchema, data);

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
    await signupUserService(parsed.data);

    return {
      success: true,
      data: { message: `${data.email}님 회원가입을 축하드립니다.` },
    };
  } catch (e) {
    return actionError(e);
  }
}
