"use client";

import { useInvitationForm } from "@/ui/hooks/useInvitationForm";
import { InvitationFormView } from "../_components/InvitationFormView";

export function InvitationForm() {
  const formState = useInvitationForm();
  return <InvitationFormView type={formState.data ? "edit" : "create"} {...formState} />;
}
