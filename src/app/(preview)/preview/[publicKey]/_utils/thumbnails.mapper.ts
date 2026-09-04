import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";
export interface ThumbnailsProps {
  divider: string;
  footer: string;
}

export const mapCoupleInfoToThumbnails = (
  coupleInfo: MobileInvitationContent,
): ThumbnailsProps => {
  return {
    divider: coupleInfo.thumbnailImages[1],
    footer: coupleInfo.thumbnailImages[2],
  };
};
