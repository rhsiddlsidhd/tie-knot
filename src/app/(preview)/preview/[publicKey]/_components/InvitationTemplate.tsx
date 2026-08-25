import type { InvitationContent } from "@/core/domain";
import { CloudImage } from "@/ui/components/molecules";
import { ThemeSync } from "./ThemeSync";
import { InteractionOverlay } from "./interactions";
import {
  mapCoupleInfoToAccountProps,
  mapCoupleInfoToCalendarProps,
  mapCoupleInfoToGalleryProps,
  mapCoupleInfoToHeroProps,
  mapCoupleInfoToInvitationProps,
  mapCoupleInfoToLocationProps,
  mapCoupleInfoToThumbnails,
} from "../_utils";
import {
  AccountSection,
  Footer,
  GallerySection,
  GuestbookSection,
  HeroSection,
  InvitationMessage,
  LocationSection,
  WeddingMonthCalendar,
} from ".";

interface InvitationTemplateProps {
  content: InvitationContent;
  publicKey: string;
  features: string[];
  theme: string;
}

export function InvitationTemplate({
  content,
  publicKey,
  features,
  theme,
}: InvitationTemplateProps) {
  const thumbnails = mapCoupleInfoToThumbnails(content);
  return (
    <div className="relative" data-theme={theme}>
      <ThemeSync theme={theme} />
      <InteractionOverlay theme={theme} />
      <HeroSection {...mapCoupleInfoToHeroProps(content)} />
      <InvitationMessage {...mapCoupleInfoToInvitationProps(content)} />
      <WeddingMonthCalendar {...mapCoupleInfoToCalendarProps(content)} />
      <GallerySection
        {...mapCoupleInfoToGalleryProps(
          content,
          features.includes("HORIZONTAL_SLIDE"),
        )}
      />
      <LocationSection {...mapCoupleInfoToLocationProps(content)} />
      <div className="relative h-[50vh] w-full">
        <CloudImage
          src={thumbnails.divider}
          sizes="(max-width: 512px) 100vw, 512px"
        />
      </div>
      {content.guestbookEnabled && <GuestbookSection publicKey={publicKey} />}
      <AccountSection {...mapCoupleInfoToAccountProps(content)} />
      <Footer>
        <CloudImage
          src={thumbnails.footer}
          sizes="(max-width: 512px) 100vw, 512px"
        />
      </Footer>
    </div>
  );
}
