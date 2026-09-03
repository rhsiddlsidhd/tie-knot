import type { InvitationContent } from "@/core/domain/invitation";
export interface GallerySectionProps {
  images: string[];
  lightboxEnabled: boolean;
}

export const mapCoupleInfoToGalleryProps = (
  coupleInfo: InvitationContent,
  lightboxEnabled: boolean,
): GallerySectionProps => ({
  images: coupleInfo.galleryImages,
  lightboxEnabled,
});
