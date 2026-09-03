import type { InvitationTheme } from "@/core/domain/theme";
import { INVITATION_THEME_LABELS } from "@/core/domain/theme";

export const getInvitationThemeOptions = () =>
  Object.entries(INVITATION_THEME_LABELS).map(([value, label]) => ({
    value: value as InvitationTheme,
    label,
  }));
