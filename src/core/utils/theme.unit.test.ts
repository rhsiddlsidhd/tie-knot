import { describe, expect, it } from "vitest";
import { INVITATION_THEMES, INVITATION_THEME_LABELS } from "@/core/domain";
import { getInvitationThemeOptions } from "./theme";

describe("getInvitationThemeOptions", () => {
  it("모든 테마를 value/label 옵션으로 반환한다", () => {
    expect(getInvitationThemeOptions()).toEqual([
      { value: "default", label: "기본" },
      { value: "blossom", label: "벚꽃" },
      { value: "botanical", label: "세이지그린" },
      { value: "midnight", label: "네이비골드" },
    ]);
  });

  it("테마 상수에 정의된 개수만큼 옵션을 만든다", () => {
    expect(getInvitationThemeOptions()).toHaveLength(INVITATION_THEMES.length);
  });

  it("label은 테마 라벨 상수에서 가져온다", () => {
    for (const option of getInvitationThemeOptions()) {
      expect(option.label).toBe(INVITATION_THEME_LABELS[option.value]);
    }
  });
});
