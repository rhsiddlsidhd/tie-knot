"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signupUser } from "@/actions/signupUser";
import { hasFieldErrors } from "@/core/utils/error";
import type { APIResponse } from "@/core/domain/error";
import { SignupForm as PureSignupForm } from "../_components/SignupForm";
import { routes } from "@/core/domain/routes";
export function SignupForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(signupUser, null);

  useEffect(() => {
    if (!state) return;
    if (state.success === true) {
      alert(state.data.message);
      router.push(routes.login);
    } else {
      if (!hasFieldErrors(state.error)) {
        toast.error(state.error.message);
      }
    }
  }, [state, router]);

  return <PureSignupForm action={action} pending={pending} state={state} />;
}
