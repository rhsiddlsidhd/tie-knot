"use client";

import { useCoupleInfoForm } from "@/ui/hooks";
import { CoupleInfoFormView } from "@/ui/components/organisms";

export function InvitationForm() {
  const formState = useCoupleInfoForm();
  return <CoupleInfoFormView type={formState.data ? "edit" : "create"} {...formState} />;
}
