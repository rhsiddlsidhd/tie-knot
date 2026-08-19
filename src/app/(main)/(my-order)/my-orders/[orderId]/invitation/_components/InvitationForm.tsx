"use client";

import { useInvitationForm } from "@/ui/hooks";
import { InvitationFormView } from "@/ui/components/organisms";

export function InvitationForm() {
  const formState = useInvitationForm();
  return <InvitationFormView type={formState.data ? "edit" : "create"} {...formState} />;
}
