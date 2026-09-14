import { MOBILE_INVITATION_THEMES, type MobileInvitationTheme } from "@/core/domain/theme";

const isMobileInvitationTheme = (theme: string): theme is MobileInvitationTheme => {
  return (MOBILE_INVITATION_THEMES as readonly string[]).includes(theme);
}

export { isMobileInvitationTheme };
