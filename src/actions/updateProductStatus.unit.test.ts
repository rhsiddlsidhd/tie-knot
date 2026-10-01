import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/product", () => ({
  updateProductStatusAsAdminService: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { updateProductStatusAsAdminService } from "@/services/product";
import { ROUTES } from "@/core/domain/routes";
import { updateProductStatus } from "./updateProductStatus";

describe("updateProductStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateProductStatusAsAdminService).mockResolvedValue({
      category: "mobile-invitation",
    } as Awaited<ReturnType<typeof updateProductStatusAsAdminService>>);
  });

  it("수정 가능한 상태면 서비스에 전달하고 관련 경로를 재검증한다", async () => {
    const result = await updateProductStatus("product-1", "inactive");

    expect(updateProductStatusAsAdminService).toHaveBeenCalledWith(
      "product-1",
      "inactive",
    );
    expect(revalidatePath).toHaveBeenCalledTimes(4);
    // 상태 전환은 카테고리 nav의 가용 서브카테고리 집합을 바꾼다 — 홈도 함께
    // 재검증해야 ISR 주기(600초)가 끝날 때까지 죽은 링크가 남지 않는다.
    expect(revalidatePath).toHaveBeenCalledWith(ROUTES.home);
    expect(result.success).toBe(true);
  });

  it("deleted 상태는 삭제 전용 흐름을 우회하지 못하게 거부한다", async () => {
    const result = await updateProductStatus("product-1", "deleted");

    expect(result).toEqual({
      success: false,
      error: {
        category: "VALIDATION",
        message: "변경할 수 없는 상품 상태입니다.",
      },
    });
    expect(updateProductStatusAsAdminService).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("알 수 없는 상태를 서비스 호출 전에 거부한다", async () => {
    const result = await updateProductStatus("product-1", "archived");

    expect(result.success).toBe(false);
    expect(updateProductStatusAsAdminService).not.toHaveBeenCalled();
  });
});
