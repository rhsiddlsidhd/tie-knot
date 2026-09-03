import type { MobileInvitationTheme } from "./theme";

export interface CouplePerson {
  name: string;
  phone: string;
}

export interface CoupleParent extends CouplePerson {
  bankName?: string;
  accountNumber?: string;
}

export interface CoupleSide extends CouplePerson {
  bankName?: string;
  accountNumber?: string;
  father?: CoupleParent;
  mother?: CoupleParent;
}

export interface MobileInvitationContent {
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
  theme: MobileInvitationTheme;
}

export type MobileInvitationEditor = MobileInvitationContent & {
  publicKey: string;
  status: "draft" | "published";
};

export const MOBILE_INVITATION_EXPIRY_DAYS = 10;
