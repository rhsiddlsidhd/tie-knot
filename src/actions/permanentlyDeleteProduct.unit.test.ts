import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/product", () => ({
  permanentlyDeleteProductAsAdminService: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { permanentlyDeleteProductAsAdminService } from "@/services/product";
import { ROUTES } from "@/core/domain/routes";
import { permanentlyDeleteProduct } from "./permanentlyDeleteProduct";

describe("permanentlyDeleteProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(permanentlyDeleteProductAsAdminService).mockResolvedValue(
      undefined as Awaited<
        ReturnType<typeof permanentlyDeleteProductAsAdminService>
      >,
    );
  });

  it("관리자 목록만 재검증한다 — 대상은 이미 공개 카탈로그에서 빠진 상품이다", async () => {
    const result = await permanentlyDeleteProduct("product-1");

    expect(permanentlyDeleteProductAsAdminService).toHaveBeenCalledWith(
      "product-1",
    );
    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith(
      ROUTES.admin.products.root,
    );
    // 다른 상품 mutation 5종과 달리 공개 경로를 재검증하지 않는 것이 의도다.
    expect(revalidatePath).not.toHaveBeenCalledWith(ROUTES.products.root);
    expect(revalidatePath).not.toHaveBeenCalledWith(ROUTES.home);
    expect(result.success).toBe(true);
  });

  it("서비스가 실패하면 재검증하지 않고 에러를 반환한다", async () => {
    vi.mocked(permanentlyDeleteProductAsAdminService).mockRejectedValue(
      new Error("boom"),
    );

    const result = await permanentlyDeleteProduct("product-1");

    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });
});
