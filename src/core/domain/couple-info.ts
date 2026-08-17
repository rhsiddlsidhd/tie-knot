export type EntityId = string | { toString(): string };

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

export interface CoupleInfo {
  _id: EntityId;
  userId: EntityId;
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
  createdAt: Date;
  updatedAt: Date;
}
