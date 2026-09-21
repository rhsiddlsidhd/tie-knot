"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { updateUserPassword } from "@/actions/updateUserPassword";
import { clearUserEmailCookie } from "@/actions/clearUserEmailCookie";
import { hasFieldErrors } from "@/core/utils/error";
import type { ApiResponse } from "@/core/domain/error";
import { UpdatePasswordForm as PureUpdatePasswordForm } from "../_components/UpdatePasswordForm";
import { ROUTES } from "@/core/domain/routes";

const UpdatePasswordForm = () => {
  const router = useRouter();
  const token = useSearchParams().get("t") ?? "";
  const [state, action, pending] = useActionState<
    ApiResponse<{ message: string }>,
    FormData
  >(updateUserPassword, null);

  useEffect(() => {
    if (!state) return;
    if (state.success === true) {
      toast.message(state.data.message);
      return router.push(ROUTES.login);
    } else {
      if (!hasFieldErrors(state.error)) {
        toast.error(state.error.message);
        router.push(ROUTES.login);
      }
    }
  }, [state, router]);

  useEffect(() => {
    return () => {
      clearUserEmailCookie().catch((error) => {
        console.debug("Cookie deletion failed during cleanup:", error);
      });
    };
  }, []);

  return (
    <PureUpdatePasswordForm
      action={action}
      pending={pending}
      state={state}
      token={token}
    />
  );
};

export { UpdatePasswordForm };
