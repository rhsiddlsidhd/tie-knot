import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/actions", () => ({
  deleteProduct: vi.fn(),
  restoreProduct: vi.fn(),
  permanentlyDeleteProduct: vi.fn(),
}));

import { deleteProduct, restoreProduct, permanentlyDeleteProduct } from "@/actions";
import type { Product } from "@/core/domain";
import { ProductTableRowAction } from "./ProductTableRowAction";

const buildProduct = (overrides?: Partial<Product>): Product => ({
  _id: "507f1f77bcf86cd799439011",
  authorId: "507f1f77bcf86cd799439012",
  title: "봄맞이 청첩장",
  description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
  thumbnail: "https://example.com/thumbnail.jpg",
  price: 9900,
  category: "invitation",
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
  deletedAt: null,
  ...overrides,
});

describe("ProductTableRowAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("view가 active(기본값)면 복구/영구 삭제 버튼은 없다", () => {
    render(<ProductTableRowAction product={buildProduct()} />);

    expect(screen.queryByText("복구")).not.toBeInTheDocument();
    expect(screen.queryByText("영구 삭제")).not.toBeInTheDocument();
  });

  it("view가 trash면 복구/영구 삭제 버튼을 렌더링한다", () => {
    render(<ProductTableRowAction product={buildProduct()} view="trash" />);

    expect(screen.getByText("복구")).toBeInTheDocument();
    expect(screen.getByText("영구 삭제")).toBeInTheDocument();
  });

  it("복구 확인 후 restoreProduct를 호출하고 성공하면 라우터를 refresh한다", async () => {
    const user = userEvent.setup();
    vi.mocked(restoreProduct).mockResolvedValue({
      success: true,
      data: { message: "상품이 성공적으로 복구되었습니다." },
    });

    render(<ProductTableRowAction product={buildProduct()} view="trash" />);

    await user.click(screen.getByText("복구"));

    expect(restoreProduct).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("삭제 확인 후 deleteProduct를 호출하고 성공하면 라우터를 refresh한다", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteProduct).mockResolvedValue({
      success: true,
      data: { message: "상품이 성공적으로 삭제되었습니다." },
    });

    render(<ProductTableRowAction product={buildProduct()} />);

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]);

    expect(deleteProduct).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("영구 삭제 확인 후 permanentlyDeleteProduct를 호출하고 성공하면 라우터를 refresh한다", async () => {
    const user = userEvent.setup();
    vi.mocked(permanentlyDeleteProduct).mockResolvedValue({
      success: true,
      data: { message: "상품이 영구적으로 삭제되었습니다." },
    });

    render(<ProductTableRowAction product={buildProduct()} view="trash" />);

    await user.click(screen.getByText("영구 삭제"));

    expect(permanentlyDeleteProduct).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(refreshMock).toHaveBeenCalledOnce();
  });
});
