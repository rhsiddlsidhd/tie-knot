import { describe, it, expect } from "vitest";
import { formatRelativeTime, getKstMonthRange, formatKstDate } from "./date";

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

describe("formatRelativeTime", () => {
  const now = new Date("2026-08-27T12:00:00.000Z");

  it("1분 미만이면 방금 전을 반환한다", () => {
    const date = new Date(now.getTime() - 30 * SECOND);
    expect(formatRelativeTime(date, now)).toBe("방금 전");
  });

  it("60분 미만이면 N분 전을 반환한다", () => {
    const date = new Date(now.getTime() - 45 * MINUTE);
    expect(formatRelativeTime(date, now)).toBe("45분 전");
  });

  it("정확히 60분이면 1시간 전으로 넘어간다", () => {
    const date = new Date(now.getTime() - 60 * MINUTE);
    expect(formatRelativeTime(date, now)).toBe("1시간 전");
  });

  it("24시간 미만이면 N시간 전을 반환한다", () => {
    const date = new Date(now.getTime() - 5 * HOUR);
    expect(formatRelativeTime(date, now)).toBe("5시간 전");
  });

  it("정확히 24시간이면 1일 전으로 넘어간다", () => {
    const date = new Date(now.getTime() - 24 * HOUR);
    expect(formatRelativeTime(date, now)).toBe("1일 전");
  });

  it("7일 미만이면 N일 전을 반환한다", () => {
    const date = new Date(now.getTime() - 6 * DAY);
    expect(formatRelativeTime(date, now)).toBe("6일 전");
  });

  it("정확히 7일 이상이면 KST 기준 절대 날짜(dot 포맷)로 폴백한다", () => {
    const date = new Date(now.getTime() - 7 * DAY);
    expect(formatRelativeTime(date, now)).toBe("2026.8.20");
  });

  it("폴백은 서버 로컬(UTC)이 아니라 Asia/Seoul 기준으로 날짜가 밀리지 않는다", () => {
    // UTC 기준 2026-08-19T15:30:00Z = KST 2026-08-20 00:30 — UTC로 포맷하면 8/19로 하루 밀린다.
    const date = new Date("2026-08-19T15:30:00.000Z");
    expect(formatRelativeTime(date, now)).toBe("2026.8.20");
  });
});

describe("formatKstDate", () => {
  it("UTC 기준 자정 넘어간 시각도 KST 날짜로 포맷한다", () => {
    // UTC 2026-08-19T15:30:00Z = KST 2026-08-20 00:30 — UTC로 포맷하면 8/19로 하루 밀린다.
    const date = new Date("2026-08-19T15:30:00.000Z");
    expect(formatKstDate(date, "dot")).toBe("2026.8.20");
  });

  it("문자열 입력도 동일하게 KST로 변환한다", () => {
    expect(formatKstDate("2026-08-19T15:30:00.000Z", "dot")).toBe(
      "2026.8.20",
    );
  });

  it("같은 입력이면 항상 같은 문자열을 반환한다(서버/브라우저 결정적)", () => {
    const date = new Date("2026-03-01T09:00:00.000Z");
    expect(formatKstDate(date, "dot")).toBe(formatKstDate(date, "dot"));
  });

  it("type을 생략하면 dot 포맷이 기본값이다", () => {
    const date = new Date("2026-08-19T15:30:00.000Z");
    expect(formatKstDate(date)).toBe("2026.8.20");
  });
});

describe("getKstMonthRange", () => {
  it("월초 KST 경계 — 8/1 00:00(KST) 입력이면 이번 달은 8월, 지난 달은 7월, 다음 달은 9월이다", () => {
    // 2026-08-01T00:00:00+09:00 === 2026-07-31T15:00:00Z
    const now = new Date("2026-07-31T15:00:00.000Z");
    const { startOfLastMonth, startOfThisMonth, startOfNextMonth } =
      getKstMonthRange(now);

    expect(startOfLastMonth.toISOString()).toBe("2026-06-30T15:00:00.000Z"); // 7/1 00:00 KST
    expect(startOfThisMonth.toISOString()).toBe("2026-07-31T15:00:00.000Z"); // 8/1 00:00 KST
    expect(startOfNextMonth.toISOString()).toBe("2026-08-31T15:00:00.000Z"); // 9/1 00:00 KST
  });

  it("월말 KST 경계 — 8/31 23:59:59(KST) 입력도 여전히 8월로 취급한다", () => {
    // 2026-08-31T23:59:59+09:00 === 2026-08-31T14:59:59Z
    const now = new Date("2026-08-31T14:59:59.000Z");
    const { startOfThisMonth, startOfNextMonth } = getKstMonthRange(now);

    expect(startOfThisMonth.toISOString()).toBe("2026-07-31T15:00:00.000Z"); // 8/1 00:00 KST
    expect(startOfNextMonth.toISOString()).toBe("2026-08-31T15:00:00.000Z"); // 9/1 00:00 KST
  });

  it("UTC 기준 날짜와 9시간 어긋나는 경계 — UTC로는 8/31이지만 KST로는 이미 9/1이다", () => {
    // 2026-08-31T15:00:00Z === 2026-09-01T00:00:00+09:00
    // UTC 날짜만 보고 월 경계를 잡으면 "8월"로 오분류되지만, KST 기준으로는 9월이 시작된 시점이다.
    const now = new Date("2026-08-31T15:00:00.000Z");
    const { startOfLastMonth, startOfThisMonth, startOfNextMonth } =
      getKstMonthRange(now);

    expect(startOfThisMonth.toISOString()).toBe("2026-08-31T15:00:00.000Z"); // 9/1 00:00 KST — now 그 자체
    expect(startOfLastMonth.toISOString()).toBe("2026-07-31T15:00:00.000Z"); // 8/1 00:00 KST
    expect(startOfNextMonth.toISOString()).toBe("2026-09-30T15:00:00.000Z"); // 10/1 00:00 KST
  });

  it("1월 입력이면 전월 경계가 작년 12월이다(연도 롤오버)", () => {
    // 2026-01-15T12:00:00+09:00 === 2026-01-15T03:00:00Z
    const now = new Date("2026-01-15T03:00:00.000Z");
    const { startOfLastMonth, startOfThisMonth, startOfNextMonth } =
      getKstMonthRange(now);

    expect(startOfLastMonth.toISOString()).toBe("2025-11-30T15:00:00.000Z"); // 2025-12-01 00:00 KST
    expect(startOfThisMonth.toISOString()).toBe("2025-12-31T15:00:00.000Z"); // 2026-01-01 00:00 KST
    expect(startOfNextMonth.toISOString()).toBe("2026-01-31T15:00:00.000Z"); // 2026-02-01 00:00 KST
  });

  it("파라미터를 생략하면 현재 시각 기준으로 세 경계를 반환한다(throw하지 않음)", () => {
    const result = getKstMonthRange();

    expect(result.startOfLastMonth.getTime()).toBeLessThan(
      result.startOfThisMonth.getTime(),
    );
    expect(result.startOfThisMonth.getTime()).toBeLessThan(
      result.startOfNextMonth.getTime(),
    );
  });
});
