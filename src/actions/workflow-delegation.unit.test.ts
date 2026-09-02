import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/core/domain/error";

const services = vi.hoisted(() => ({
  loginUserService: vi.fn(),
  signupUserService: vi.fn(),
  completePaymentService: vi.fn(),
  deleteProductAsAdminService: vi.fn(),
  restoreProductAsAdminService: vi.fn(),
  permanentlyDeleteProductAsAdminService: vi.fn(),
  toggleProductLikeForCurrentUserService: vi.fn(),
  createReviewForCurrentUserService: vi.fn(),
  updateReviewForCurrentUserService: vi.fn(),
  deleteReviewForCurrentUserService: vi.fn(),
  deleteReviewByAdminService: vi.fn(),
}));
const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock("@/services/auth", () => ({
  loginUserService: services.loginUserService,
}));
vi.mock("@/services/user", () => ({
  signupUserService: services.signupUserService,
}));
vi.mock("@/services/payment", () => ({
  completePaymentService: services.completePaymentService,
}));
vi.mock("@/services/product", () => ({
  deleteProductAsAdminService: services.deleteProductAsAdminService,
  restoreProductAsAdminService: services.restoreProductAsAdminService,
  permanentlyDeleteProductAsAdminService: services.permanentlyDeleteProductAsAdminService,
  toggleProductLikeForCurrentUserService: services.toggleProductLikeForCurrentUserService,
}));
vi.mock("@/services/review", () => ({
  createReviewForCurrentUserService: services.createReviewForCurrentUserService,
  updateReviewForCurrentUserService: services.updateReviewForCurrentUserService,
  deleteReviewForCurrentUserService: services.deleteReviewForCurrentUserService,
  deleteReviewByAdminService: services.deleteReviewByAdminService,
}));
vi.mock("next/cache", () => ({ revalidatePath }));

import { loginUser } from "./loginUser";
import { signupUser } from "./signupUser";
import { completePayment } from "./completePayment";
import { deleteProduct } from "./deleteProduct";
import { restoreProduct } from "./restoreProduct";
import { permanentlyDeleteProduct } from "./permanentlyDeleteProduct";
import { toggleProductLike } from "./toggleProductLike";
import { createReview } from "./createReview";
import { updateReview } from "./updateReview";
import { deleteReview } from "./deleteReview";
import { deleteReviewByAdmin } from "./deleteReviewByAdmin";

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

  it("상품 복구 성공 후 관련 캐시를 갱신한다", async () => {
    services.restoreProductAsAdminService.mockResolvedValue(undefined);

    const result = await restoreProduct("product-1");

    expect(services.restoreProductAsAdminService).toHaveBeenCalledWith("product-1");
    expect(revalidatePath).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
  });

  it("상품 영구 삭제 성공 후 관련 캐시를 갱신한다", async () => {
    services.permanentlyDeleteProductAsAdminService.mockResolvedValue(undefined);

    const result = await permanentlyDeleteProduct("product-1");

    expect(services.permanentlyDeleteProductAsAdminService).toHaveBeenCalledWith(
      "product-1",
    );
    expect(revalidatePath).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  it("좋아요 변경을 현재 사용자 유스케이스에 위임한다", async () => {
    services.toggleProductLikeForCurrentUserService.mockResolvedValue(undefined);

    const result = await toggleProductLike("product-1");

    expect(services.toggleProductLikeForCurrentUserService).toHaveBeenCalledWith("product-1");
    expect(result.success).toBe(true);
  });

  it("createReview는 검증된 입력을 현재 사용자 유스케이스에 위임한다", async () => {
    services.createReviewForCurrentUserService.mockResolvedValue({});

    const result = await createReview(
      null,
      formData({
        orderId: "order-1",
        rating: "5",
        content: "만족스러운 상품이었습니다.",
      }),
    );

    expect(services.createReviewForCurrentUserService).toHaveBeenCalledWith({
      orderId: "order-1",
      rating: 5,
      content: "만족스러운 상품이었습니다.",
      images: [],
    });
    expect(result.success).toBe(true);
  });

  it("createReview는 검증 실패 시 Service를 호출하지 않는다", async () => {
    const result = await createReview(
      null,
      formData({ orderId: "order-1", rating: "5", content: "짧음" }),
    );

    expect(result.success).toBe(false);
    expect(services.createReviewForCurrentUserService).not.toHaveBeenCalled();
  });

  it("updateReview는 채운 필드만 골라 현재 사용자 유스케이스에 위임한다", async () => {
    services.updateReviewForCurrentUserService.mockResolvedValue({});

    const result = await updateReview(
      null,
      formData({ reviewId: "review-1", rating: "4" }),
    );

    expect(services.updateReviewForCurrentUserService).toHaveBeenCalledWith({
      reviewId: "review-1",
      rating: 4,
    });
    expect(result.success).toBe(true);
  });

  it("deleteReview는 리뷰 ID를 현재 사용자 유스케이스에 위임한다", async () => {
    services.deleteReviewForCurrentUserService.mockResolvedValue(undefined);

    const result = await deleteReview("review-1");

    expect(services.deleteReviewForCurrentUserService).toHaveBeenCalledWith("review-1");
    expect(result.success).toBe(true);
  });

  it("deleteReviewByAdmin은 리뷰 ID를 어드민 유스케이스에 위임한다", async () => {
    services.deleteReviewByAdminService.mockResolvedValue(undefined);

    const result = await deleteReviewByAdmin("review-1");

    expect(services.deleteReviewByAdminService).toHaveBeenCalledWith("review-1");
    expect(result.success).toBe(true);
  });
});
