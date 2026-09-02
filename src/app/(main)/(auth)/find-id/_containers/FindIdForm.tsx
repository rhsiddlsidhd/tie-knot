"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { findUserEmail } from "@/actions/findUserEmail";
import { hasFieldErrors } from "@/core/utils/error";
import type { APIResponse } from "@/core/domain/error";
import { FindIdForm as PureFindIdForm } from "../_components/FindIdForm";
export function FindIdForm() {
  const [state, action, pending] = useActionState<
    APIResponse<{ email: string }>,
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
}
