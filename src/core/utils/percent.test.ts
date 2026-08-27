import { describe, it, expect } from "vitest";
import { formatSignedPercent } from "./percent";

describe("formatSignedPercent", () => {
  it("previous가 0이면 null을 반환한다(0 나눗셈 방지, 전월 실적 없음)", () => {
    expect(formatSignedPercent(1000, 0)).toBeNull();
  });

  it("현재값이 더 크면 양수 label과 up 방향을 반환한다", () => {
    expect(formatSignedPercent(1125, 1000)).toEqual({
      label: "+12.5%",
      direction: "up",
    });
  });

  it("현재값이 더 작으면 음수 label과 down 방향을 반환한다", () => {
    expect(formatSignedPercent(920, 1000)).toEqual({
      label: "-8.0%",
      direction: "down",
    });
  });

  it("변화가 없으면 flat 방향을 반환한다", () => {
    expect(formatSignedPercent(1000, 1000)).toEqual({
      label: "0.0%",
      direction: "flat",
    });
  });

  it("previous가 음수라도 부호/방향을 정확히 계산한다", () => {
    // (10 - (-10)) / -10 * 100 = -200%
    expect(formatSignedPercent(10, -10)).toEqual({
      label: "-200.0%",
      direction: "down",
    });
  });
});
