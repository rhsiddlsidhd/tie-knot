import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/product", () => ({
  deleteProductAsAdminService: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { deleteProductAsAdminService } from "@/services/product";
import { ROUTES } from "@/core/domain/routes";
import { deleteProduct } from "./deleteProduct";

describe("deleteProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deleteProductAsAdminService).mockResolvedValue(
      undefined as Awaited<ReturnType<typeof deleteProductAsAdminService>>,
    );
  });

  it("삭제 성공 시 관리자·공개 목록과 홈을 재검증한다", async () => {
    const result = await deleteProduct("product-1");

    expect(deleteProductAsAdminService).toHaveBeenCalledWith("product-1");
    // 마지막 공개 상품이 사라지면 그 서브카테고리 링크가 죽는다 — 홈의 카테고리
    // 둘러보기와 헤더 nav가 같은 조회를 쓰므로 홈까지 재검증한다.
    expect(revalidatePath).toHaveBeenCalledWith(ROUTES.home);
    expect(revalidatePath).toHaveBeenCalledWith(ROUTES.products.root);
    expect(revalidatePath).toHaveBeenCalledWith(ROUTES.admin.products.root);
    expect(result.success).toBe(true);
  });

  it("서비스가 실패하면 재검증하지 않고 에러를 반환한다", async () => {
    vi.mocked(deleteProductAsAdminService).mockRejectedValue(new Error("boom"));

    const result = await deleteProduct("product-1");

    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });
});
