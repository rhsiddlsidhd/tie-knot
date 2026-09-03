import type { MobileInvitationTheme } from "@/core/domain/theme";
import { MOBILE_INVITATION_THEME_LABELS } from "@/core/domain/theme";

export const getMobileInvitationThemeOptions = () =>
  Object.entries(MOBILE_INVITATION_THEME_LABELS).map(([value, label]) => ({
    value: value as MobileInvitationTheme,
    label,
  }));
