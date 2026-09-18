"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { requestPasswordReset } from "@/actions/requestPasswordReset";
import { hasFieldErrors } from "@/core/utils/error";
import type { ApiResponse } from "@/core/domain/error";
import { ForgotPasswordForm as PureForgotPasswordForm } from "../_components/ForgotPasswordForm";
const ForgotPasswordForm = () => {
  const [state, action, pending] = useActionState<
    ApiResponse<{ message: string; email: string }>,
    FormData
  >(requestPasswordReset, null);

  useEffect(() => {
    if (!state || state.success === true) return;

    if (!hasFieldErrors(state.error)) {
      toast.error(state.error.message);
    }
  }, [state]);

  return (
    <PureForgotPasswordForm action={action} pending={pending} state={state} />
  );
};

export { ForgotPasswordForm };
