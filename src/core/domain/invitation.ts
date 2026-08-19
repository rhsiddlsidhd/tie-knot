import type { IInvitation } from "@/models";

export type InvitationContent = Pick<
  IInvitation,
  | "groom"
  | "bride"
  | "weddingDate"
  | "venue"
  | "address"
  | "addressDetail"
  | "subwayStation"
  | "guestbookEnabled"
  | "thumbnailImages"
  | "galleryImages"
>;

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
