import type { ICoupleInfo } from "@/shared/types";
export interface ThumbnailsProps {
  divider: string;
  footer: string;
}

export const mapCoupleInfoToThumbnails = (
  coupleInfo: ICoupleInfo,
): ThumbnailsProps => {
  return {
    divider: coupleInfo.thumbnailImages[1],
    footer: coupleInfo.thumbnailImages[2],
  };
};
