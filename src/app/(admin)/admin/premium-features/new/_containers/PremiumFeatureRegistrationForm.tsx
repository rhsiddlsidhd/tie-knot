"use client";

import { useActionState, useEffect } from "react";

import { createPremiumFeature } from "@/actions/createPremiumFeature";
import type { ApiResponse } from "@/core/domain/error";
import { PremiumFeatureRegistrationForm as PurePremiumFeatureRegistrationForm } from "../_components/PremiumFeatureRegistrationForm";
const PremiumFeatureRegistrationForm = () => {
  const [state, action, pending] = useActionState<
    ApiResponse<{ message: string }>,
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
};

export { PremiumFeatureRegistrationForm };
