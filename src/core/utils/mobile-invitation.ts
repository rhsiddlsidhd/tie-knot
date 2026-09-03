import { MOBILE_INVITATION_EXPIRY_DAYS } from "@/core/domain/mobile-invitation";

export const isMobileInvitationExpired = (
  weddingDate: Date,
  now = new Date(),
): boolean => {
  const expiresAt = new Date(weddingDate);
  expiresAt.setDate(expiresAt.getDate() + MOBILE_INVITATION_EXPIRY_DAYS);
  return now > expiresAt;
};
