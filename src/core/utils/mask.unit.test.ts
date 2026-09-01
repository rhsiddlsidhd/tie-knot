import { describe, it, expect } from "vitest";
import { maskName } from "./mask";

describe("maskName", () => {
  it("3글자 이름은 가운데 한 글자를 마스킹한다", () => {
    expect(maskName("김민준")).toBe("김*준");
  });

  it("4글자 이상 이름은 가운데 전부를 마스킹한다", () => {
    expect(maskName("남궁민준")).toBe("남**준");
  });

  it("2글자 이름은 마지막 글자만 마스킹한다", () => {
    expect(maskName("김수")).toBe("김*");
  });

  it("1글자 이하는 원문 그대로 리턴한다", () => {
    expect(maskName("김")).toBe("김");
    expect(maskName("")).toBe("");
  });
});
