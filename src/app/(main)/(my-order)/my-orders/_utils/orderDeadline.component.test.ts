import { describe, it, expect } from "vitest";
import { getMobileInvitationInputDaysLeft } from "./orderDeadline";

describe("getMobileInvitationInputDaysLeft", () => {
  const confirmedAt = new Date("2026-08-01T00:00:00.000Z");

  it("결제 직후에는 기한 전체(7일)가 남는다", () => {
    expect(getMobileInvitationInputDaysLeft(confirmedAt, confirmedAt)).toBe(7);
  });

  it("나흘이 지나면 3일 남는다", () => {
    expect(
      getMobileInvitationInputDaysLeft(confirmedAt, new Date("2026-08-05T00:00:00.000Z")),
    ).toBe(3);
  });

  it("마감 당일에는 0을 리턴한다", () => {
    expect(
      getMobileInvitationInputDaysLeft(confirmedAt, new Date("2026-08-07T12:00:00.000Z")),
    ).toBe(0);
  });

  it("기한이 지나면 음수를 리턴한다", () => {
    expect(
      getMobileInvitationInputDaysLeft(confirmedAt, new Date("2026-08-09T00:00:00.000Z")),
    ).toBe(-1);
  });

  it("ISO 문자열도 같은 결과를 낸다", () => {
    expect(
      getMobileInvitationInputDaysLeft(
        confirmedAt.toISOString(),
        new Date("2026-08-05T00:00:00.000Z"),
      ),
    ).toBe(3);
  });
});
