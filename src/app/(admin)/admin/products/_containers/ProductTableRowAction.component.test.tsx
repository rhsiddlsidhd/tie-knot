import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/actions/deleteProduct", () => ({
  deleteProduct: vi.fn(),
}));
vi.mock("@/actions/restoreProduct", () => ({
  restoreProduct: vi.fn(),
}));
vi.mock("@/actions/permanentlyDeleteProduct", () => ({
  permanentlyDeleteProduct: vi.fn(),
}));

import { deleteProduct } from "@/actions/deleteProduct";
import { restoreProduct } from "@/actions/restoreProduct";
import { permanentlyDeleteProduct } from "@/actions/permanentlyDeleteProduct";
import type { Product } from "@/core/domain/product";
import { ProductTableRowAction } from "./ProductTableRowAction";
import type { ProductTableRowProps } from "../_components/ProductTableRow";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import { createAppStore, type AppStoreApi } from "@/ui/stores/app.store";
import { StoreProvider } from "@/ui/stores/provider";

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

// ProductTableRowAction은 useAdminModalStore를 구독하므로 StoreProvider 없이는
// 마운트 시점에 throw한다 — 테스트마다 새 store 인스턴스를 만들어 주입한다.
let testStore: AppStoreApi;

const renderAction = (props: ProductTableRowProps) =>
  render(
    <StoreProvider store={testStore}>
      <ProductTableRowAction {...props} />
    </StoreProvider>,
  );

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const dialogButton = (name: string) =>
  within(screen.getByRole("alertdialog")).getByRole("button", { name });

describe("ProductTableRowAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testStore = createAppStore();
  });

  it("view가 active(기본값)면 복구/영구 삭제 버튼은 없다", () => {
    renderAction({ product: buildProduct() });

    expect(screen.queryByText("복구")).not.toBeInTheDocument();
    expect(screen.queryByText("영구 삭제")).not.toBeInTheDocument();
  });

  it("view가 trash면 복구/영구 삭제 버튼을 렌더링한다", () => {
    renderAction({ product: buildProduct(), view: "trash" });

    expect(screen.getByText("복구")).toBeInTheDocument();
    expect(screen.getByText("영구 삭제")).toBeInTheDocument();
  });

  it("복구 확인창은 되돌릴 수 있는 동작임을 알리고, 확인하면 restoreProduct를 호출한다", async () => {
    const user = userEvent.setup();
    vi.mocked(restoreProduct).mockResolvedValue({
      success: true,
      data: { message: "상품이 성공적으로 복구되었습니다." },
    });

    renderAction({ product: buildProduct(), view: "trash" });

    await user.click(screen.getByRole("button", { name: "복구" }));

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("봄맞이 청첩장");
    expect(dialog).toHaveTextContent("다시 삭제할 수 있습니다");

    await user.click(dialogButton("복구"));

    expect(restoreProduct).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("삭제 확인창은 휴지통 복구 가능을 알리고, 확인하면 deleteProduct를 호출한다", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteProduct).mockResolvedValue({
      success: true,
      data: { message: "상품이 성공적으로 삭제되었습니다." },
    });

    renderAction({ product: buildProduct() });

    await user.click(screen.getByRole("button", { name: "상품 삭제" }));

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("봄맞이 청첩장");
    expect(dialog).toHaveTextContent("휴지통에서 복구할 수 있습니다");

    await user.click(dialogButton("삭제"));

    expect(deleteProduct).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("삭제를 취소하면 deleteProduct를 호출하지 않는다", async () => {
    const user = userEvent.setup();
    renderAction({ product: buildProduct() });

    await user.click(screen.getByRole("button", { name: "상품 삭제" }));
    await user.click(dialogButton("취소"));

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(deleteProduct).not.toHaveBeenCalled();
  });

  it("삭제에 실패하면 확인창을 열어둔 채 다시 시도할 수 있다", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteProduct).mockResolvedValue({
      success: false,
      error: { category: "INTERNAL", message: "삭제에 실패했습니다." },
    });

    renderAction({ product: buildProduct() });

    await user.click(screen.getByRole("button", { name: "상품 삭제" }));
    await user.click(dialogButton("삭제"));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();

    await user.click(dialogButton("삭제"));
    expect(deleteProduct).toHaveBeenCalledTimes(2);
  });

  it("삭제가 진행되는 동안 확인 버튼을 다시 눌러도 deleteProduct를 중복 호출하지 않는다", async () => {
    const deferred = createDeferred<{ success: true; data: { message: string } }>();
    vi.mocked(deleteProduct).mockReturnValue(deferred.promise);
    const user = userEvent.setup();

    renderAction({ product: buildProduct() });

    await user.click(screen.getByRole("button", { name: "상품 삭제" }));
    await user.click(dialogButton("삭제"));
    await user.click(dialogButton("삭제 중..."));

    expect(deleteProduct).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve({ success: true, data: { message: "삭제되었습니다." } });
    });
  });

  it("영구 삭제는 상품명을 정확히 입력해야 permanentlyDeleteProduct를 호출한다", async () => {
    const user = userEvent.setup();
    vi.mocked(permanentlyDeleteProduct).mockResolvedValue({
      success: true,
      data: { message: "상품이 영구적으로 삭제되었습니다." },
    });

    renderAction({ product: buildProduct(), view: "trash" });

    await user.click(screen.getByRole("button", { name: "영구 삭제" }));

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "복구할 수 없습니다",
    );
    expect(dialogButton("영구 삭제")).toBeDisabled();

    await user.type(
      screen.getByLabelText('확인을 위해 상품명 "봄맞이 청첩장"을 입력하세요'),
      "봄맞이 청첩장",
    );
    await user.click(dialogButton("영구 삭제"));

    expect(permanentlyDeleteProduct).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
    );
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});
