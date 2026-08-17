"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signupUser } from "@/actions";
import { hasFieldErrors } from "@/core/utils";
import type { APIResponse } from "@/core/domain";
import { SignupForm as PureSignupForm } from "@/client/components/organisms";
import { routes } from "@/core/domain";
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
