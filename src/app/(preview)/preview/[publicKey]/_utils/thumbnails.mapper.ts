import type { InvitationContent } from "@/core/domain";
export interface ThumbnailsProps {
  divider: string;
  footer: string;
}

export const mapCoupleInfoToThumbnails = (
  coupleInfo: InvitationContent,
): ThumbnailsProps => {
  return {
    divider: coupleInfo.thumbnailImages[1],
    footer: coupleInfo.thumbnailImages[2],
  };
};
