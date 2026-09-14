import type { MobileInvitationTheme } from "./theme";

interface CouplePerson {
  name: string;
  phone: string;
}

interface CoupleParent extends CouplePerson {
  bankName?: string;
  accountNumber?: string;
}

interface CoupleSide extends CouplePerson {
  bankName?: string;
  accountNumber?: string;
  father?: CoupleParent;
  mother?: CoupleParent;
}

interface MobileInvitationContent {
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

type MobileInvitationEditor = MobileInvitationContent & {
  publicKey: string;
  status: "draft" | "published";
};

const MOBILE_INVITATION_EXPIRY_DAYS = 10;

export {
  MOBILE_INVITATION_EXPIRY_DAYS,
  type CouplePerson,
  type CoupleParent,
  type CoupleSide,
  type MobileInvitationContent,
  type MobileInvitationEditor,
};
