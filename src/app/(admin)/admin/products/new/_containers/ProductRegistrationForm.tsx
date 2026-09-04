"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createProduct } from "@/actions/createProduct";
import type { APIResponse } from "@/core/domain/error";
import type { PremiumFeature } from "@/core/domain/premium-feature";
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

  // "등록 후 계속 작성" 버튼으로 제출됐는지 기록한다 — true면 성공해도 목록으로
  // 이동하지 않고 폼에 남는다(초기화는 순수 컴포넌트가 스스로 처리한다).
  const continueRegistrationRef = useRef(false);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(state.data.message);
      if (!continueRegistrationRef.current) {
        router.push(routes.admin.products.root);
      }
    }
  }, [state, router]);

  return (
    <PureProductRegistrationForm
      premiumFeatures={premiumFeatures}
      action={action}
      pending={pending}
      state={state}
      onCancel={() => router.push(routes.admin.products.root)}
      onSubmitIntentChange={(continueRegistration) => {
        continueRegistrationRef.current = continueRegistration;
      }}
    />
  );
}
