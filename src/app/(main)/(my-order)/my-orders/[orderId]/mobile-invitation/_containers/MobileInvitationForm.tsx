"use client";

import { useMobileInvitationForm } from "@/ui/hooks/useMobileInvitationForm";
import { MobileInvitationFormView } from "../_components/MobileInvitationFormView";

const MobileInvitationForm = () => {
  const formState = useMobileInvitationForm();
  return <MobileInvitationFormView type={formState.data ? "edit" : "create"} {...formState} />;
}

export { MobileInvitationForm };
