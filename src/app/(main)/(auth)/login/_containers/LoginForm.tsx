"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { toast } from "sonner";

import { loginUser } from "@/actions/loginUser";
import type { APIResponse } from "@/core/domain/error";
import type { UserRole } from "@/core/domain/user";
import { getFieldError, hasFieldErrors } from "@/core/utils/error";
import { LoginForm as PureLoginForm } from "../_components/LoginForm";
import { routes } from "@/core/domain/routes";
export function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<
    APIResponse<{ role: UserRole; email: string; userId: string }>,
    FormData
  >(loginUser, null);

  useEffect(() => {
    if (!state) return;
    if (state.success === true) {
      mutate(
        "/api/auth/me",
        {
          role: state.data.role,
          email: state.data.email,
          userId: state.data.userId,
        },
        false,
      );
      return router.push(routes.home);
    } else {
      if (!hasFieldErrors(state.error)) {
        toast.error(state.error.message);
      }
    }
  }, [state, router]);

  const emailError = getFieldError(state, "email");
  const passwordError = getFieldError(state, "password");

  return (
    <PureLoginForm
      action={action}
      pending={pending}
      emailError={emailError}
      passwordError={passwordError}
    />
  );
}
