import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/premiumFeature", () => ({
  updatePremiumFeatureAsAdminService: vi.fn(),
}));

import { updatePremiumFeatureAsAdminService } from "@/services/premiumFeature";
import { updatePremiumFeature } from "./updatePremiumFeature";

const buildFormData = (overrides?: Record<string, string>) => {
  const formData = new FormData();
  formData.set("featureId", "feature-1");
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

describe("updatePremiumFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("등록 가능 토글이 켜져 있으면 isActive: true로 넘긴다", async () => {
    await updatePremiumFeature(null, buildFormData());

    expect(updatePremiumFeatureAsAdminService).toHaveBeenCalledWith(
      "feature-1",
      expect.objectContaining({ isActive: true }),
    );
  });

  it("등록 가능 토글이 없으면 isActive: false로 넘긴다", async () => {
    const formData = buildFormData();
    formData.delete("isActive");

    await updatePremiumFeature(null, formData);

    expect(updatePremiumFeatureAsAdminService).toHaveBeenCalledWith(
      "feature-1",
      expect.objectContaining({ isActive: false }),
    );
  });

  it("featureId가 없으면 서비스를 호출하지 않는다", async () => {
    const formData = buildFormData();
    formData.delete("featureId");

    const result = await updatePremiumFeature(null, formData);

    expect(result.success).toBe(false);
    expect(updatePremiumFeatureAsAdminService).not.toHaveBeenCalled();
  });
});
