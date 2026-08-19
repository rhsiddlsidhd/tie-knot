import type { InvitationContent } from "@/core/domain";
export interface WeddingMonthCalendarProps {
  date: Date;
}

export const mapCoupleInfoToCalendarProps = (
  coupleInfo: InvitationContent,
): WeddingMonthCalendarProps => {
  return {
    date: coupleInfo.weddingDate,
  };
};
