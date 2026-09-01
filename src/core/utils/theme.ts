import type { InvitationTheme } from "@/core/domain";
import { INVITATION_THEME_LABELS } from "@/core/domain";

export const getInvitationThemeOptions = () =>
  Object.entries(INVITATION_THEME_LABELS).map(([value, label]) => ({
    value: value as InvitationTheme,
    label,
  }));
