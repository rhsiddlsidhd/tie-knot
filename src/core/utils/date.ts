import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { startOfMonth, subMonths, addMonths } from "date-fns";

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

export const getTimeDiff = (target: Date, now: Date = new Date()) => {
  const diff = Math.max(target.getTime() - now.getTime(), 0);

  const days = Math.floor(diff / DAY);
  const hours = Math.floor((diff % DAY) / HOUR);
  const minutes = Math.floor((diff % HOUR) / MINUTE);
  const seconds = Math.floor((diff % MINUTE) / SECOND);

  return { diff, days, hours, minutes, seconds };
};

export const calculateCountdown = ({
  weddingDate,
  now,
}: {
  weddingDate: Date;
  now?: Date;
}) => {
  const { days, hours, minutes, seconds } = getTimeDiff(weddingDate, now);

  return {
    days,
    hour: hours,
    min: minutes,
    sec: seconds,
  };
};

export const updateCountdownMessage = (
  weddingDate: Date,
  now?: Date,
): string => {
  const { days, hours, minutes } = getTimeDiff(weddingDate, now);

  if (days > 0) return `결혼식까지 ${days}일 남았습니다`;
  if (hours > 0) return `결혼식까지 ${hours}시간 남았습니다`;
  if (minutes > 0) return `결혼식까지 ${minutes}분 남았습니다`;

  return "결혼식이 끝났습니다";
};

/** 주어진 시각이 속한 KST 기준 전월·이번 달·다음 달 경계를 UTC instant로 돌려준다. */
export const getKstMonthRange = (now: Date = new Date()) => {
  const zoned = toZonedTime(now, "Asia/Seoul");
  return {
    startOfLastMonth: fromZonedTime(startOfMonth(subMonths(zoned, 1)), "Asia/Seoul"),
    startOfThisMonth: fromZonedTime(startOfMonth(zoned), "Asia/Seoul"),
    startOfNextMonth: fromZonedTime(startOfMonth(addMonths(zoned, 1)), "Asia/Seoul"),
  };
};

export type DateFormatType =
  | "slash"
  | "dot"
  | "text"
  | "weekdayKr"
  | "weekdayEng"
  | "default";

/**
 * 날짜를 지정된 형식으로 변환합니다.
 */
export const formatDate = (date: string | Date, type: DateFormatType) => {
  const newDate = typeof date === "string" ? new Date(date) : date;
  const year = newDate.getFullYear();
  const month = newDate.getMonth() + 1;
  const dayDate = newDate.getDate();
  const day = newDate.getDay();

  const weekdaysEng = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const weekdaysKr = [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
  ];

  switch (type) {
    case "slash":
      return `${year}/${month}/${dayDate}`;
    case "dot":
      return `${year}.${month}.${dayDate}`;
    case "text":
      return `${year}년 ${month}월 ${dayDate}일`;
    case "weekdayKr":
      return weekdaysKr[day];
    case "weekdayEng":
      return weekdaysEng[day];
    default:
      return `${year}-${month}-${dayDate}`;
  }
};

export const KST_TIMEZONE = "Asia/Seoul";

/**
 * 서버/브라우저의 로컬 timezone과 무관하게 항상 KST(Asia/Seoul) 기준으로
 * 결정적인 날짜 문자열을 만든다. `toZonedTime`이 반환하는 Date는 wall-clock
 * getter(`getFullYear` 등)가 KST 기준값을 읽도록 내부 timestamp를 이동시키므로
 * 그대로 `formatDate`에 넘길 수 있다(`formatRelativeTime`의 마지막 폴백과 동일 패턴).
 */
export const formatKstDate = (
  date: string | Date,
  type: DateFormatType = "dot",
): string => {
  const target = typeof date === "string" ? new Date(date) : date;
  return formatDate(toZonedTime(target, KST_TIMEZONE), type);
};

/**
 * 과거 시각과 기준 시각(now)의 차이를 상대 시간 문구로 변환한다.
 * <1분 "방금 전", <60분 "N분 전", <24시간 "N시간 전", <7일 "N일 전",
 * 그 이상은 KST(Asia/Seoul) 기준 `formatDate(date, "dot")` 폴백.
 */
export const formatRelativeTime = (date: Date, now: Date = new Date()): string => {
  const diff = now.getTime() - date.getTime();

  if (diff < MINUTE) return "방금 전";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}분 전`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`;
  if (diff < DAY * 7) return `${Math.floor(diff / DAY)}일 전`;

  return formatDate(toZonedTime(date, KST_TIMEZONE), "dot");
};
