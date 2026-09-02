import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/adapters/browser/cloudinary", () => ({
  CloudinaryWidget: ({
    children,
  }: {
    children: (controls: {
      isLoading: boolean;
      open: () => void;
    }) => React.ReactNode;
  }) => children({ isLoading: false, open: vi.fn() }),
}));

vi.mock("@/actions/updateProduct", () => ({
  updateProduct: () => async (): Promise<null> => null,
}));

vi.mock("@/ui/hooks", () => ({
  usePremiumFeature: (): { premiumFeatures: never[]; loading: boolean } => ({
    premiumFeatures: [],
    loading: false,
  }),
  useImageList: () => ({
    items: [] as unknown[],
    add: vi.fn(),
    remove: vi.fn(),
    getUrls: (): string[] => [],
  }),
}));

import type { Product } from "@/core/domain";
import { ProductEditDialog } from "./ProductEditDialog";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain";

const buildProduct = (overrides?: Partial<Product>): Product => ({
  _id: "507f1f77bcf86cd799439011",
  authorId: "507f1f77bcf86cd799439012",
  title: "봄맞이 청첩장",
  description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
  thumbnail: "https://example.com/thumbnail.jpg",
  price: 9900,
  category: MOBILE_INVITATION_CATEGORY,
  subCategory: "wedding",
  isPremium: false,
  featureIds: [],
  isFeatured: false,
  priority: 0,
  likes: [],
  views: 0,
  salesCount: 0,
  discount: { discountType: "rate", value: 0 },
  status: "active",
  theme: "default",
  isLiked: false,
  discountedPrice: 9900,
  images: [],
  minQuantity: 1,
  maxQuantity: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ratingAverage: 0,
  ratingCount: 0,
  deletedAt: null,
  ...overrides,
});

describe("ProductEditDialog", () => {
  it("기존 상품 데이터로 필드를 채워 렌더링한다", () => {
    render(<ProductEditDialog product={buildProduct()} />);

    expect(screen.getByDisplayValue("봄맞이 청첩장")).toBeInTheDocument();
    expect(screen.getByText("테마")).toBeInTheDocument();
  });

  it("테마를 변경하면 선택한 테마로 표시가 바뀐다", async () => {
    const user = userEvent.setup();
    render(<ProductEditDialog product={buildProduct({ theme: "default" })} />);

    const themeTrigger = screen
      .getAllByRole("combobox")
      .find((el) => el.textContent?.includes("기본"));
    expect(themeTrigger).toBeDefined();

    await user.click(themeTrigger!);
    await user.click(await screen.findByRole("option", { name: "벚꽃" }));

    expect(themeTrigger!.textContent).toContain("벚꽃");
  });

  it("판매 상태 드롭다운에 삭제 옵션을 제공하지 않는다 (#136 — 삭제는 삭제/복구 버튼 전용 경로)", async () => {
    const user = userEvent.setup();
    render(<ProductEditDialog product={buildProduct({ status: "active" })} />);

    const statusTrigger = screen
      .getAllByRole("combobox")
      .find((el) => el.textContent?.includes("판매중"));
    expect(statusTrigger).toBeDefined();

    await user.click(statusTrigger!);

    expect(screen.getByRole("option", { name: "판매중" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "비활성" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "품절" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "삭제" })).not.toBeInTheDocument();
  });
});
