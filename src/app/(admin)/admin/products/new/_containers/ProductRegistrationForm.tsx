"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createProduct } from "@/actions/createProduct";
import type { APIResponse } from "@/core/domain/error";
import type { PremiumFeature } from "@/services/premiumFeature";
import { ProductRegistrationForm as PureProductRegistrationForm } from "../_components/ProductRegistrationForm";
import { routes } from "@/core/domain/routes";
export function ProductRegistrationForm({
  premiumFeatures,
}: {
  premiumFeatures: PremiumFeature[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(createProduct, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(state.data.message);
      router.push(routes.admin.products.root);
    }
  }, [state, router]);

  return (
    <PureProductRegistrationForm
      premiumFeatures={premiumFeatures}
      action={action}
      pending={pending}
      state={state}
      onCancel={() => router.push(routes.admin.products.root)}
    />
  );
}
