import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";
interface HeroSectionProps {
  groomName: string;
  brideName: string;
  weddingDate: Date;
  venueName: string;
  address: string;
  addressDetail?: string;
  thumbnailImage: string;
}

const mapCoupleInfoToHeroProps = (
  coupleInfo: MobileInvitationContent,
): HeroSectionProps => {
  return {
    groomName: coupleInfo.groom.name,
    brideName: coupleInfo.bride.name,
    weddingDate: coupleInfo.weddingDate,
    venueName: coupleInfo.venue,
    address: coupleInfo.address,
    addressDetail: coupleInfo.addressDetail,
    thumbnailImage: coupleInfo.thumbnailImages[0],
  };
};

export { mapCoupleInfoToHeroProps, type HeroSectionProps };
