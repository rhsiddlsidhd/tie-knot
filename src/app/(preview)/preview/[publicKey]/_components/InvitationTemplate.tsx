import type { InvitationContent } from "@/core/domain";
import { AppImage } from "@/ui/components/atoms";
import { InteractionOverlay } from "./interactions";
import { ThemeAmbience } from "./ThemeAmbience";
import { ThemeSync } from "./ThemeSync";
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
