import { afterEach, describe, expect, it, vi } from "vitest";
import { INVITATION_EXPIRY_DAYS } from "@/core/domain";
import { isInvitationExpired } from "./invitation";

const WEDDING_DATE = new Date("2026-06-10T14:00:00");

// 예식일 + INVITATION_EXPIRY_DAYS(10일)이 만료 시각이다.
const expiresAt = () => {
  const date = new Date(WEDDING_DATE);
  date.setDate(date.getDate() + INVITATION_EXPIRY_DAYS);
  return date;
};

const offsetFromExpiry = (ms: number) => new Date(expiresAt().getTime() + ms);

afterEach(() => {
  vi.useRealTimers();
});

describe("isInvitationExpired", () => {
  it("예식 당일은 만료되지 않았다", () => {
    expect(isInvitationExpired(WEDDING_DATE, WEDDING_DATE)).toBe(false);
  });

  it("만료 1ms 전은 만료되지 않았다", () => {
    expect(isInvitationExpired(WEDDING_DATE, offsetFromExpiry(-1))).toBe(false);
  });

  it("정확히 만료 시각은 아직 만료되지 않았다", () => {
    expect(isInvitationExpired(WEDDING_DATE, offsetFromExpiry(0))).toBe(false);
  });

  it("만료 1ms 후는 만료됐다", () => {
    expect(isInvitationExpired(WEDDING_DATE, offsetFromExpiry(1))).toBe(true);
  });

  it("만료일을 한참 지나면 만료됐다", () => {
    expect(
      isInvitationExpired(WEDDING_DATE, new Date("2027-01-01T00:00:00")),
    ).toBe(true);
  });

  it("now를 생략하면 현재 시각을 기준으로 판정한다", () => {
    vi.useFakeTimers();

    vi.setSystemTime(offsetFromExpiry(-1));
    expect(isInvitationExpired(WEDDING_DATE)).toBe(false);

    vi.setSystemTime(offsetFromExpiry(1));
    expect(isInvitationExpired(WEDDING_DATE)).toBe(true);
  });

  it("전달한 weddingDate를 변형하지 않는다", () => {
    const weddingDate = new Date(WEDDING_DATE);

    isInvitationExpired(weddingDate, offsetFromExpiry(1));

    expect(weddingDate.getTime()).toBe(WEDDING_DATE.getTime());
  });
});
