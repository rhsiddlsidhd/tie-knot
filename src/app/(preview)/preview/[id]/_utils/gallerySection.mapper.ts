import type { ICoupleInfo } from "@/shared/types";
export interface GallerySectionProps {
  images: string[];
  lightboxEnabled: boolean;
}

export const mapCoupleInfoToGalleryProps = (
  coupleInfo: ICoupleInfo,
  lightboxEnabled: boolean,
): GallerySectionProps => ({
  images: coupleInfo.galleryImages,
  lightboxEnabled,
});
