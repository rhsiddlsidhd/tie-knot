import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";
import { AppImage } from "@/ui/components/atoms/app-image";
import { InteractionOverlay } from "@/app/(preview)/preview/[publicKey]/_components/interactions/InteractionOverlay";
import { ThemeAmbience } from "./ThemeAmbience";
import { ThemeSync } from "./ThemeSync";
import { mapCoupleInfoToAccountProps } from "@/app/(preview)/preview/[publicKey]/_utils/accountSection.mapper";
import { mapCoupleInfoToCalendarProps } from "@/app/(preview)/preview/[publicKey]/_utils/weddingMonthCalendar.mapper";
import { mapCoupleInfoToGalleryProps } from "@/app/(preview)/preview/[publicKey]/_utils/gallerySection.mapper";
import { mapCoupleInfoToHeroProps } from "@/app/(preview)/preview/[publicKey]/_utils/heroSection.mapper";
import { mapCoupleInfoToMobileInvitationProps } from "@/app/(preview)/preview/[publicKey]/_utils/mobileInvitationMessage.mapper";
import { mapCoupleInfoToLocationProps } from "@/app/(preview)/preview/[publicKey]/_utils/locationSection.mapper";
import { mapCoupleInfoToThumbnails } from "@/app/(preview)/preview/[publicKey]/_utils/thumbnails.mapper";
import { AccountSection } from "@/app/(preview)/preview/[publicKey]/_components/AccountSection";
import { Footer } from "@/app/(preview)/preview/[publicKey]/_components/Footer";
import { GallerySection } from "@/app/(preview)/preview/[publicKey]/_components/GallerySection";
import { GuestbookSection } from "@/app/(preview)/preview/[publicKey]/_components/GuestbookSection";
import { HeroSection } from "@/app/(preview)/preview/[publicKey]/_components/HeroSection";
import { MobileInvitationMessage } from "@/app/(preview)/preview/[publicKey]/_components/MobileInvitationMessage";
import { LocationSection } from "@/app/(preview)/preview/[publicKey]/_components/LocationSection";
import { WeddingMonthCalendar } from "@/app/(preview)/preview/[publicKey]/_components/WeddingMonthCalendar";

interface MobileInvitationTemplateProps {
  content: MobileInvitationContent;
  publicKey: string;
  features: string[];
  theme: string;
}

export function MobileInvitationTemplate({
  content,
  publicKey,
  features,
  theme,
}: MobileInvitationTemplateProps) {
  const thumbnails = mapCoupleInfoToThumbnails(content);
  return (
    <div className="relative" data-theme={theme}>
      <ThemeSync theme={theme} />
      {/*
        ThemeAmbience와 실제 콘텐츠를 같은 grid cell(grid-area:1/1)에 겹쳐
        쌓는다 — sticky 배경(ThemeAmbience 내부)이 콘텐츠 높이만큼 문서 흐름을
        밀어내지 않으면서도, 카드 폭 안에서 뷰포트 한 화면 분량만 항상
        보이도록 고정되게 하기 위해서다(sticky는 부모 grid row 높이 = 콘텐츠
        전체 높이를 기준으로 스크롤 내내 유효하다).
      */}
      <div className="grid">
        <ThemeAmbience theme={theme} />
        <div className="relative [grid-area:1/1]">
          <InteractionOverlay theme={theme} />
          <HeroSection {...mapCoupleInfoToHeroProps(content)} />
          <MobileInvitationMessage {...mapCoupleInfoToMobileInvitationProps(content)} />
          <WeddingMonthCalendar {...mapCoupleInfoToCalendarProps(content)} />
          <GallerySection
            {...mapCoupleInfoToGalleryProps(
              content,
              features.includes("HORIZONTAL_SLIDE"),
            )}
          />
          <LocationSection {...mapCoupleInfoToLocationProps(content)} />
          <div className="relative h-[50vh] w-full">
            <AppImage
              src={thumbnails.divider}
              sizes="(max-width: 512px) 100vw, 512px"
            />
          </div>
          {content.guestbookEnabled && (
            <GuestbookSection publicKey={publicKey} />
          )}
          <AccountSection {...mapCoupleInfoToAccountProps(content)} />
          <Footer>
            <AppImage
              src={thumbnails.footer}
              sizes="(max-width: 512px) 100vw, 512px"
            />
          </Footer>
        </div>
      </div>
    </div>
  );
}
