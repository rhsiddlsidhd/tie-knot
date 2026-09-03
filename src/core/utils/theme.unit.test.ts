import { describe, expect, it } from "vitest";
import { MOBILE_INVITATION_THEMES, MOBILE_INVITATION_THEME_LABELS } from "@/core/domain/theme";
import { getMobileInvitationThemeOptions } from "./theme";

describe("getMobileInvitationThemeOptions", () => {
  it("모든 테마를 value/label 옵션으로 반환한다", () => {
    expect(getMobileInvitationThemeOptions()).toEqual([
      { value: "default", label: "기본" },
      { value: "blossom", label: "벚꽃" },
      { value: "botanical", label: "세이지그린" },
      { value: "midnight", label: "네이비골드" },
    ]);
  });

  it("테마 상수에 정의된 개수만큼 옵션을 만든다", () => {
    expect(getMobileInvitationThemeOptions()).toHaveLength(MOBILE_INVITATION_THEMES.length);
  });

  it("label은 테마 라벨 상수에서 가져온다", () => {
    for (const option of getMobileInvitationThemeOptions()) {
      expect(option.label).toBe(MOBILE_INVITATION_THEME_LABELS[option.value]);
    }
  });
});
