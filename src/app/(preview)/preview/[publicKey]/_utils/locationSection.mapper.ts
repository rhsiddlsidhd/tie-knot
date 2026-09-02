import type { InvitationContent } from "@/core/domain/invitation";
export interface LocationSectionProps {
  venueName: string;
  address: string;
  addressDetail?: string;
  subwayStation?: string;
}

export const mapCoupleInfoToLocationProps = (
  coupleInfo: InvitationContent,
): LocationSectionProps => {
  return {
    venueName: coupleInfo.venue,
    address: coupleInfo.address,
    addressDetail: coupleInfo.addressDetail,
    subwayStation: coupleInfo.subwayStation,
  };
};
