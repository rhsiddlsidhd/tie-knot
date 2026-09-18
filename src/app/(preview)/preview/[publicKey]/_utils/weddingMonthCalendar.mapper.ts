import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";
interface WeddingMonthCalendarProps {
  date: Date;
}

const mapCoupleInfoToCalendarProps = (
  coupleInfo: MobileInvitationContent,
): WeddingMonthCalendarProps => {
  return {
    date: coupleInfo.weddingDate,
  };
};

export { mapCoupleInfoToCalendarProps, type WeddingMonthCalendarProps };
