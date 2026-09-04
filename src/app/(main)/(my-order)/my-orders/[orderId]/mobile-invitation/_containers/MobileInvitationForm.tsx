"use client";

import { useMobileInvitationForm } from "@/ui/hooks/useMobileInvitationForm";
import { MobileInvitationFormView } from "../_components/MobileInvitationFormView";

export function MobileInvitationForm() {
  const formState = useMobileInvitationForm();
  return <MobileInvitationFormView type={formState.data ? "edit" : "create"} {...formState} />;
}
