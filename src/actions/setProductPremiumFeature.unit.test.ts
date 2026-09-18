import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "@/core/domain/error";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/product", () => ({
  attachPremiumFeatureToProductService: vi.fn(),
  detachPremiumFeatureFromProductService: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import {
  attachPremiumFeatureToProductService,
  detachPremiumFeatureFromProductService,
} from "@/services/product";
import { setProductPremiumFeature } from "./setProductPremiumFeature";

describe("setProductPremiumFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attached가 true면 연결 서비스를 호출한다", async () => {
    const result = await setProductPremiumFeature({
      productId: "product-1",
      featureId: "feature-1",
      attached: true,
    });

    expect(attachPremiumFeatureToProductService).toHaveBeenCalledWith(
      "product-1",
      "feature-1",
    );
    expect(detachPremiumFeatureFromProductService).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it("attached가 false면 해제 서비스를 호출한다", async () => {
    const result = await setProductPremiumFeature({
      productId: "product-1",
      featureId: "feature-1",
      attached: false,
    });

    expect(detachPremiumFeatureFromProductService).toHaveBeenCalledWith(
      "product-1",
      "feature-1",
    );
    expect(attachPremiumFeatureToProductService).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  it("성공하면 기능별 상품 연결 경로를 재검증한다", async () => {
    await setProductPremiumFeature({
      productId: "product-1",
      featureId: "feature-1",
      attached: true,
    });

    expect(revalidatePath).toHaveBeenCalledWith(
      "/admin/premium-features/feature-1/products",
    );
  });

  it("마지막 기능이라 막히면 실패 응답으로 바꾸고 재검증하지 않는다", async () => {
    vi.mocked(detachPremiumFeatureFromProductService).mockRejectedValue(
      new AppError("VALIDATION", "마지막 프리미엄 기능이라 뗄 수 없습니다."),
    );

    const result = await setProductPremiumFeature({
      productId: "product-1",
      featureId: "feature-1",
      attached: false,
    });

    expect(result.success).toBe(false);
    expect(result.success === false && result.error.message).toBe(
      "마지막 프리미엄 기능이라 뗄 수 없습니다.",
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
