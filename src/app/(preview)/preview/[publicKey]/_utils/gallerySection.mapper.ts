import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";
export interface GallerySectionProps {
  images: string[];
  lightboxEnabled: boolean;
}

export const mapCoupleInfoToGalleryProps = (
  coupleInfo: MobileInvitationContent,
  lightboxEnabled: boolean,
): GallerySectionProps => ({
  images: coupleInfo.galleryImages,
  lightboxEnabled,
});
