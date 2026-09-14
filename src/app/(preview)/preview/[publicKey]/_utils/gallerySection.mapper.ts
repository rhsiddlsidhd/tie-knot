import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";
interface GallerySectionProps {
  images: string[];
  lightboxEnabled: boolean;
}

const mapCoupleInfoToGalleryProps = (
  coupleInfo: MobileInvitationContent,
  lightboxEnabled: boolean,
): GallerySectionProps => ({
  images: coupleInfo.galleryImages,
  lightboxEnabled,
});

export { mapCoupleInfoToGalleryProps, type GallerySectionProps };
