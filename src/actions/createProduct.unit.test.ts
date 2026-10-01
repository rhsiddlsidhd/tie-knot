import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/product", () => ({
  createProductWorkflow: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { createProductWorkflow } from "@/services/product";
import { ROUTES } from "@/core/domain/routes";
import { DISCOUNT_TYPE } from "@/core/domain/product";
import { createProduct } from "./createProduct";

// ProductSchema를 실제로 통과하는 최소 입력. mobile-invitation은 images 없이도
// 판매가 성립해 상세 이미지를 비워둘 수 있다.
const buildFormData = (overrides?: Record<string, string>): FormData => {
  const formData = new FormData();
  const entries: Record<string, string> = {
    title: "테스트 샘플 상품",
    description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
    category: "mobile-invitation",
    subCategory: "wedding",
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

describe("createProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createProductWorkflow).mockResolvedValue(
      undefined as Awaited<ReturnType<typeof createProductWorkflow>>,
    );
  });

  it("등록 성공 시 관리자·공개 목록과 홈을 재검증한다", async () => {
    const result = await createProduct(null, buildFormData());

    expect(createProductWorkflow).toHaveBeenCalledOnce();
    // 새 상품이 첫 공개 상품이면 그 서브카테고리가 비로소 가용해진다 — 홈의
    // 카테고리 둘러보기가 ISR 주기를 기다리지 않고 바로 반영되어야 한다.
    expect(revalidatePath).toHaveBeenCalledWith(ROUTES.home);
    expect(revalidatePath).toHaveBeenCalledWith(ROUTES.products.root);
    expect(revalidatePath).toHaveBeenCalledWith(ROUTES.admin.products.root);
    expect(result.success).toBe(true);
  });

  it("검증 실패면 서비스 호출과 재검증 없이 필드 에러를 반환한다", async () => {
    const result = await createProduct(
      null,
      buildFormData({ description: "짧다" }),
    );

    expect(createProductWorkflow).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
  });
});
