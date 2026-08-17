"use client";

import { useCoupleInfoForm } from "@/ui/hooks";
import { CoupleInfoFormView } from "@/ui/components/organisms";
export function CoupleInfoForm() {
  const formState = useCoupleInfoForm({ type: "edit" });

  return <CoupleInfoFormView type="edit" {...formState} />;
}
