"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { findUserEmail } from "@/actions/findUserEmail";
import { hasFieldErrors } from "@/core/utils/error";
import type { ApiResponse } from "@/core/domain/error";
import { FindIdForm as PureFindIdForm } from "../_components/FindIdForm";
const FindIdForm = () => {
  const [state, action, pending] = useActionState<
    ApiResponse<{ email: string }>,
    FormData
  >(findUserEmail, null);

  useEffect(() => {
    if (!state) return;
    if (state.success === false) {
      if (!hasFieldErrors(state.error)) {
        toast.error(state.error.message);
      }
    }
  }, [state]);

  return <PureFindIdForm action={action} pending={pending} state={state} />;
};

export { FindIdForm };
