import type { ICoupleInfo } from "@/shared/types";
export interface WeddingMonthCalendarProps {
  date: Date;
}

export const mapCoupleInfoToCalendarProps = (
  coupleInfo: ICoupleInfo,
): WeddingMonthCalendarProps => {
  return {
    date: coupleInfo.weddingDate,
  };
};
