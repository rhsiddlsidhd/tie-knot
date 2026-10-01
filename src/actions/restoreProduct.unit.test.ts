import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/product", () => ({
  restoreProductAsAdminService: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { restoreProductAsAdminService } from "@/services/product";
import { ROUTES } from "@/core/domain/routes";
import { restoreProduct } from "./restoreProduct";

describe("restoreProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(restoreProductAsAdminService).mockResolvedValue(
      undefined as Awaited<ReturnType<typeof restoreProductAsAdminService>>,
    );
  });

  it("복구 성공 시 관리자·공개 목록과 홈을 재검증한다", async () => {
    const result = await restoreProduct("product-1");

    expect(restoreProductAsAdminService).toHaveBeenCalledWith("product-1");
    // 복구로 서브카테고리가 다시 가용해지면 홈에 링크가 나타나야 한다.
    expect(revalidatePath).toHaveBeenCalledWith(ROUTES.home);
    expect(revalidatePath).toHaveBeenCalledWith(ROUTES.products.root);
    expect(revalidatePath).toHaveBeenCalledWith(ROUTES.admin.products.root);
    expect(result.success).toBe(true);
  });

  it("서비스가 실패하면 재검증하지 않고 에러를 반환한다", async () => {
    vi.mocked(restoreProductAsAdminService).mockRejectedValue(
      new Error("boom"),
    );

    const result = await restoreProduct("product-1");

    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });
});
