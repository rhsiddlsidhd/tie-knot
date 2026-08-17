interface Person {
  name: string;
  phone: string;
}

interface Parent extends Person {
  bankName?: string;
  accountNumber?: string;
}

interface CoupleSide extends Person {
  bankName?: string;
  accountNumber?: string;
  father?: Parent;
  mother?: Parent;
}

export interface ICoupleInfo {
  _id: string;
  userId: string;
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
