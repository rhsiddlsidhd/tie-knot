import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("여러 className 문자열을 하나로 합친다", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("falsy 값(false, null, undefined)을 걸러낸다", () => {
    expect(cn("px-2", false, null, undefined, "py-1")).toBe("px-2 py-1");
  });

  it("조건부 객체 형태의 className을 지원한다", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("충돌하는 Tailwind 유틸리티는 나중 값이 이전 값을 덮어쓴다", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("서로 다른 유틸리티는 충돌 없이 모두 유지한다", () => {
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
  });

  it("입력이 없으면 빈 문자열을 반환한다", () => {
    expect(cn()).toBe("");
  });

  it("배열 형태의 className도 병합한다", () => {
    expect(cn(["px-2", "py-1"], "text-sm")).toBe("px-2 py-1 text-sm");
  });
});
