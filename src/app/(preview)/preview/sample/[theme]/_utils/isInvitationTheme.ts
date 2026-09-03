import { INVITATION_THEMES, type InvitationTheme } from "@/core/domain/theme";

export function isInvitationTheme(theme: string): theme is InvitationTheme {
  return (INVITATION_THEMES as readonly string[]).includes(theme);
}
