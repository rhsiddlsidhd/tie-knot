import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";
export interface LocationSectionProps {
  venueName: string;
  address: string;
  addressDetail?: string;
  subwayStation?: string;
}

export const mapCoupleInfoToLocationProps = (
  coupleInfo: MobileInvitationContent,
): LocationSectionProps => {
  return {
    venueName: coupleInfo.venue,
    address: coupleInfo.address,
    addressDetail: coupleInfo.addressDetail,
    subwayStation: coupleInfo.subwayStation,
  };
};
