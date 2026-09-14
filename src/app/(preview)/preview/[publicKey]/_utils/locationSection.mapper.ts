import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";
interface LocationSectionProps {
  venueName: string;
  address: string;
  addressDetail?: string;
  subwayStation?: string;
}

const mapCoupleInfoToLocationProps = (
  coupleInfo: MobileInvitationContent,
): LocationSectionProps => {
  return {
    venueName: coupleInfo.venue,
    address: coupleInfo.address,
    addressDetail: coupleInfo.addressDetail,
    subwayStation: coupleInfo.subwayStation,
  };
};

export { mapCoupleInfoToLocationProps, type LocationSectionProps };
