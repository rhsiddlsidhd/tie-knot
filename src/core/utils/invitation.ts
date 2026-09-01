import { INVITATION_EXPIRY_DAYS } from "@/core/domain";

export const isInvitationExpired = (
  weddingDate: Date,
  now = new Date(),
): boolean => {
  const expiresAt = new Date(weddingDate);
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);
  return now > expiresAt;
};
