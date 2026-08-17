import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/core/domain";

const services = vi.hoisted(() => ({
  loginUserService: vi.fn(),
  signupUserService: vi.fn(),
  completePaymentService: vi.fn(),
  deleteProductAsAdminService: vi.fn(),
  toggleProductLikeForCurrentUserService: vi.fn(),
}));
const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/services", () => services);
vi.mock("next/cache", () => ({ revalidatePath }));

import { loginUser } from "./loginUser";
import { signupUser } from "./signupUser";
import { completePayment } from "./completePayment";
import { deleteProduct } from "./deleteProduct";
import { toggleProductLike } from "./toggleProductLike";

const formData = (data: Record<string, string>) => {
  const result = new FormData();
  Object.entries(data).forEach(([key, value]) => result.set(key, value));
  return result;
};

describe("Action 유스케이스 위임", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loginUser는 검증된 입력을 로그인 유스케이스에 위임한다", async () => {
    services.loginUserService.mockResolvedValue({
      role: "USER",
      email: "user@example.com",
      userId: "user-1",
    });

    const result = await loginUser(
      null,
      formData({ email: "user@example.com", password: "pw1234!", remember: "on" }),
    );

    expect(services.loginUserService).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "pw1234!",
      remember: true,
    });
    expect(result.success).toBe(true);
  });

  it("signupUser는 검증 실패 시 Service를 호출하지 않는다", async () => {
    const result = await signupUser(null, formData({ email: "invalid" }));

    expect(result.success).toBe(false);
    expect(services.signupUserService).not.toHaveBeenCalled();
  });

  it("Service의 AppError를 Action 응답으로 변환한다", async () => {
    services.completePaymentService.mockRejectedValue(
      new AppError("NOT_FOUND", "결제를 찾을 수 없습니다."),
    );

    const result = await completePayment("payment-1");

    expect(result).toEqual({
      success: false,
      error: {
        category: "NOT_FOUND",
        message: "결제를 찾을 수 없습니다.",
        fieldErrors: undefined,
      },
    });
  });

  it("상품 삭제 성공 후 관련 캐시를 갱신한다", async () => {
    services.deleteProductAsAdminService.mockResolvedValue(undefined);

    const result = await deleteProduct("product-1");

    expect(services.deleteProductAsAdminService).toHaveBeenCalledWith("product-1");
    expect(revalidatePath).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
  });

  it("좋아요 변경을 현재 사용자 유스케이스에 위임한다", async () => {
    services.toggleProductLikeForCurrentUserService.mockResolvedValue(undefined);

    const result = await toggleProductLike("product-1");

    expect(services.toggleProductLikeForCurrentUserService).toHaveBeenCalledWith("product-1");
    expect(result.success).toBe(true);
  });
});
