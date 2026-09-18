// ---- 값이 원본 ----
const MOBILE_INVITATION_THEMES = [
  "default",
  "blossom",
  "botanical",
  "midnight",
] as const;

type MobileInvitationTheme = (typeof MOBILE_INVITATION_THEMES)[number];

const MOBILE_INVITATION_THEME_LABELS: Record<MobileInvitationTheme, string> = {
  default: "기본",
  blossom: "벚꽃",
  botanical: "세이지그린",
  midnight: "네이비골드",
};

export { MOBILE_INVITATION_THEMES, MOBILE_INVITATION_THEME_LABELS, type MobileInvitationTheme };
