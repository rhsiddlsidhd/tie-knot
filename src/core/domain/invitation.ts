import type { CoupleSide } from "./couple-info";

export interface InvitationContent {
  groom: CoupleSide;
  bride: CoupleSide;
  weddingDate: Date;
  venue: string;
  address: string;
  addressDetail: string;
  subwayStation?: string;
  guestbookEnabled: boolean;
  thumbnailImages: string[];
  galleryImages: string[];
}

export type InvitationEditor = InvitationContent & {
  publicKey: string;
  status: "draft" | "published";
};

export const INVITATION_EXPIRY_DAYS = 10;

export const isInvitationExpired = (
  weddingDate: Date,
  now = new Date(),
): boolean => {
  const expiresAt = new Date(weddingDate);
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);
  return now > expiresAt;
};
