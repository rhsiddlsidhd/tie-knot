import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/premiumFeature", () => ({
  createPremiumFeatureAsAdminService: vi.fn(),
}));

import { createPremiumFeatureAsAdminService } from "@/services/premiumFeature";
import { createPremiumFeature } from "./createPremiumFeature";

const buildFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  formData.set("code", "GALLERY_LIGHTBOX");
  formData.set("label", "갤러리 확대 보기");
  formData.set("description", "사진을 눌러 전체화면으로 크게 볼 수 있습니다.");
  formData.set("additionalPrice", "3000");
  formData.set("isActive", "on");
  Object.entries(overrides ?? {}).forEach(([key, value]) =>
    formData.set(key, value),
  );
  return formData;
};

describe("createPremiumFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("등록 가능 토글이 켜져 있으면 isActive: true로 넘긴다", async () => {
    await createPremiumFeature(null, buildFormData());

    expect(createPremiumFeatureAsAdminService).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true }),
    );
  });

  it("등록 가능 토글이 없으면 isActive: false로 넘긴다", async () => {
    const formData = buildFormData();
    formData.delete("isActive");

    await createPremiumFeature(null, formData);

    expect(createPremiumFeatureAsAdminService).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });

  it("구현되지 않은 code면 서비스를 호출하지 않고 VALIDATION을 리턴한다", async () => {
    const result = await createPremiumFeature(
      null,
      buildFormData({ code: "MAP" }),
    );

    expect(result.success).toBe(false);
    expect(createPremiumFeatureAsAdminService).not.toHaveBeenCalled();
  });
});
