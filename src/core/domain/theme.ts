// ---- 값이 원본 ----
export const INVITATION_THEMES = [
  "default",
  "blossom",
  "botanical",
  "midnight",
] as const;

export type InvitationTheme = (typeof INVITATION_THEMES)[number];

export const INVITATION_THEME_LABELS: Record<InvitationTheme, string> = {
  default: "기본",
  blossom: "벚꽃",
  botanical: "세이지그린",
  midnight: "네이비골드",
};
