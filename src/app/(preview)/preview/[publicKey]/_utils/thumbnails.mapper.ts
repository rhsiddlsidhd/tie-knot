import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";
interface ThumbnailsProps {
  divider: string;
  footer: string;
}

const mapCoupleInfoToThumbnails = (
  coupleInfo: MobileInvitationContent,
): ThumbnailsProps => {
  return {
    divider: coupleInfo.thumbnailImages[1],
    footer: coupleInfo.thumbnailImages[2],
  };
};

export { mapCoupleInfoToThumbnails, type ThumbnailsProps };
