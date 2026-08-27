import { describe, it, expect } from "vitest";
import { getKstMonthRange } from "./date";

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
