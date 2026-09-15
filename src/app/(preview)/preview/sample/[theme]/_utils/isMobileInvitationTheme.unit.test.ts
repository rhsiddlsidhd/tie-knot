import { describe, expect, it } from "vitest";

import { isMobileInvitationTheme } from "./isMobileInvitationTheme";

describe("isMobileInvitationTheme", () => {
  it("등록된 테마 값이면 true를 반환한다", () => {
    expect(isMobileInvitationTheme("blossom")).toBe(true);
  });

  it("등록되지 않은 값이면 false를 반환한다", () => {
    expect(isMobileInvitationTheme("not-a-theme")).toBe(false);
  });
});
