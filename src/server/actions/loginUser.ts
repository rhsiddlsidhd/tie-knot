"use server";

import type { APIResponse } from "@/core/domain";

import { validateAndFlatten } from "@/core/utils";
import { LoginSchema } from "@/core/schemas";
import { encrypt } from "@/adapters/jose";
import { setCookie } from "@/adapters/cookies";
import { getUser } from "@/services";
import type { UserRole } from "@/core/domain";
import { comparePasswords } from "@/adapters/bcrypt";
import { actionError } from "@/server/boundary";

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

  const { email, password, remember } = parsed.data;

  // 이메일를 바탕으로 사용자 조회
  const user = await getUser({ email });

  if (!user) {
    return {
      success: false,
      error: { category: "UNAUTHENTICATED", message: "이메일 또는 비밀번호가 일치하지 않습니다." },
    };
  }

  const isPasswordValid = await comparePasswords(password, user.password);

  if (!isPasswordValid) {
    return {
      success: false,
      error: { category: "UNAUTHENTICATED", message: "이메일 또는 비밀번호가 일치하지 않습니다." },
    };
  }

  try {
    const refreshJWT = await encrypt({
      id: user._id.toString(),
      role: user.role,
      type: "REFRESH",
    });

    await setCookie({ name: "token", value: refreshJWT, remember });

    return {
      success: true,
      data: { role: user.role, email: user.email, userId: user._id.toString() },
    };
  } catch (e) {
    return actionError(e);
  }
};
