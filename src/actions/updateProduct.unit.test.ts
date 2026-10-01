import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/product", () => ({
  updateProductWorkflow: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { updateProductWorkflow } from "@/services/product";
import { ROUTES } from "@/core/domain/routes";
import { DISCOUNT_TYPE } from "@/core/domain/product";
import { updateProduct } from "./updateProduct";

const buildFormData = (overrides?: Record<string, string>): FormData => {
  const formData = new FormData();
  const entries: Record<string, string> = {
    title: "테스트 샘플 상품",
    description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
    category: "mobile-invitation",
    subCategory: "wedding",
    status: "inactive",
    price: "9900",
    isPremium: "false",
    isFeatured: "false",
    priority: "0",
    thumbnail: "https://example.com/thumbnail.jpg",
    "discount.discountType": DISCOUNT_TYPE.RATE,
    "discount.value": "0",
    ...overrides,
  };
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
};

describe("updateProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateProductWorkflow).mockResolvedValue(
      undefined as Awaited<ReturnType<typeof updateProductWorkflow>>,
    );
  });

  it("수정 성공 시 상세·목록과 홈을 재검증한다", async () => {
    const result = await updateProduct("product-1", null, buildFormData());

    expect(updateProductWorkflow).toHaveBeenCalledOnce();
    // status·category·subCategory 수정은 가용 서브카테고리 집합을 바꾼다.
    expect(revalidatePath).toHaveBeenCalledWith(ROUTES.home);
    expect(revalidatePath).toHaveBeenCalledWith(ROUTES.products.root);
    expect(revalidatePath).toHaveBeenCalledWith(
      ROUTES.products.detail("mobile-invitation", "product-1"),
    );
    expect(result.success).toBe(true);
  });

  it("검증 실패면 서비스 호출과 재검증 없이 필드 에러를 반환한다", async () => {
    const result = await updateProduct(
      "product-1",
      null,
      buildFormData({ subCategory: "candle" }),
    );

    expect(updateProductWorkflow).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });
});
