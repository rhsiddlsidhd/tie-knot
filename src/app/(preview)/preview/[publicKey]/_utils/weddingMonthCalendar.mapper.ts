import type { MobileInvitationContent } from "@/core/domain/mobile-invitation";
export interface WeddingMonthCalendarProps {
  date: Date;
}

export const mapCoupleInfoToCalendarProps = (
  coupleInfo: MobileInvitationContent,
): WeddingMonthCalendarProps => {
  return {
    date: coupleInfo.weddingDate,
  };
};
