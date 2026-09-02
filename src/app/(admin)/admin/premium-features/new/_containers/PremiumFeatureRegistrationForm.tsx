"use client";

import { useActionState, useEffect } from "react";

import { createPremiumFeature } from "@/actions/createPremiumFeature";
import type { APIResponse } from "@/core/domain";
import { PremiumFeatureRegistrationForm as PurePremiumFeatureRegistrationForm } from "../_components/PremiumFeatureRegistrationForm";
export function PremiumFeatureRegistrationForm() {
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(createPremiumFeature, null);

  useEffect(() => {
    if (state && state.success && state.data) alert(state.data.message);
  }, [state]);

  return (
    <PurePremiumFeatureRegistrationForm
      action={action}
      pending={pending}
      state={state}
    />
  );
}
