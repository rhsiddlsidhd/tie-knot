"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { PremiumFeature } from "@/services";
import { updatePremiumFeature } from "@/actions";
import type { APIResponse } from "@/core/domain";
import { hasFieldErrors } from "@/core/utils";
import { PremiumFeatureDialog as PurePremiumFeatureDialog } from "../_components/PremiumFeatureDialog";
export function PremiumFeatureDialog({
  premiumFeature,
}: {
  premiumFeature: PremiumFeature;
}) {
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(updatePremiumFeature, null);

  useEffect(() => {
    if (!state) return;
    if (state.success === true) {
      toast.success(state.data.message);
    } else {
      if (!hasFieldErrors(state.error)) {
        toast.error(state.error.message);
      }
    }
  }, [state]);

  return (
    <PurePremiumFeatureDialog
      premiumFeature={premiumFeature}
      action={action}
      pending={pending}
      state={state}
    />
  );
}
