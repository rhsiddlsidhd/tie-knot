export type SignedPercentTrend = {
  label: string;
  direction: "up" | "down" | "flat";
};

/**
 * 전월 대비 증감률을 계산한다. `previous`가 0이면 0 나눗셈(→ "+∞%")을 피하기 위해
 * `null`을 반환한다 — 서비스 오픈 첫 달처럼 전월 실적이 없는 경우가 상시 경로다.
 * 부호/방향을 완성 문자열이 아니라 구조체로 반환해야 UI가 색상을 판정할 수 있다.
 */
export const formatSignedPercent = (
  current: number,
  previous: number,
): SignedPercentTrend | null => {
  if (previous === 0) return null;

  const percent = ((current - previous) / previous) * 100;
  const direction: SignedPercentTrend["direction"] =
    percent > 0 ? "up" : percent < 0 ? "down" : "flat";
  const sign = percent > 0 ? "+" : percent < 0 ? "-" : "";

  return {
    label: `${sign}${Math.abs(percent).toFixed(1)}%`,
    direction,
  };
};
