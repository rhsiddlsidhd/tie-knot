import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Product } from "@/core/domain/product";
import type { PremiumFeature } from "@/core/domain/premium-feature";

const { usePremiumFeatureMock, closeModalMock } = vi.hoisted(() => ({
  usePremiumFeatureMock: vi.fn(),
  closeModalMock: vi.fn(),
}));

vi.mock("@/actions/updateProduct", () => ({
  updateProduct: vi.fn(),
}));
vi.mock("@/ui/hooks/usePremiumFeatures", () => ({
  usePremiumFeature: usePremiumFeatureMock,
}));
vi.mock("@/ui/stores/use-app-store", () => ({
  useAdminModalStore: (
    selector: (state: { closeModal: () => void }) => unknown,
  ) => selector({ closeModal: closeModalMock }),
}));
vi.mock("sonner", () => ({
  toast: { message: vi.fn(), error: vi.fn() },
}));
vi.mock("@/adapters/browser/cloudinary/widget", () => ({
  CloudinaryWidget: ({
    children,
    folder,
    onUpload,
  }: {
    children: (controls: {
      isLoading: boolean;
      open: () => void;
    }) => React.ReactNode;
    folder: string;
    onUpload: (url: string) => void;
  }) =>
    children({
      isLoading: false,
      open: () => onUpload(`https://res.cloudinary.com/demo/${folder}.jpg`),
    }),
}));

import { updateProduct } from "@/actions/updateProduct";
import { toast } from "sonner";
import { ProductEditDialog } from "./ProductEditDialog";

const buildFeature = (overrides?: Partial<PremiumFeature>): PremiumFeature => ({
  _id: "feature-1",
  code: "GUESTBOOK",
  label: "방명록",
  description: "방명록 기능",
  additionalPrice: 3000,
  isActive: true,
  createdAt: new Date("2026-08-01T00:00:00.000Z").toISOString(),
  ...overrides,
});

const buildProduct = (overrides?: Partial<Product>): Product => ({
  _id: "product-1",
  authorId: "admin-1",
  title: "봄맞이 청첩장",
  description: "봄 느낌 가득한 모바일 청첩장입니다.",
  thumbnail: "https://res.cloudinary.com/demo/thumb.jpg",
  price: 29000,
  category: "mobile-invitation",
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
  images: ["https://res.cloudinary.com/demo/img1.jpg"],
  minQuantity: 1,
  maxQuantity: 100,
  ratingAverage: 0,
  ratingCount: 0,
  theme: "default",
  isLiked: false,
  discountedPrice: 29000,
  createdAt: new Date("2026-08-01T00:00:00.000Z").toISOString(),
  updatedAt: new Date("2026-08-01T00:00:00.000Z").toISOString(),
  deletedAt: null,
  ...overrides,
});

describe("ProductEditDialog (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePremiumFeatureMock.mockReturnValue({ premiumFeatures: [], loading: false });
  });

  it("프리미엄 기능 목록을 불러오는 중이면 폼 대신 스피너를 렌더링한다", () => {
    usePremiumFeatureMock.mockReturnValue({ premiumFeatures: [], loading: true });

    render(<ProductEditDialog product={buildProduct()} />);

    expect(screen.queryByLabelText(/상품명/)).not.toBeInTheDocument();
  });

  it("로딩이 끝나면 상품 값을 각 필드의 기본값으로 렌더링한다", () => {
    render(<ProductEditDialog product={buildProduct()} />);

    expect(screen.getByLabelText(/상품명/)).toHaveValue("봄맞이 청첩장");
    expect(screen.getByLabelText(/상품 설명/)).toHaveValue(
      "봄 느낌 가득한 모바일 청첩장입니다.",
    );
    expect(screen.getByLabelText(/기본 가격/)).toHaveValue(29000);
  });

  it("취소 버튼을 클릭하면 모달을 닫는다", async () => {
    const user = userEvent.setup();
    render(<ProductEditDialog product={buildProduct()} />);

    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(closeModalMock).toHaveBeenCalledTimes(1);
  });

  it("프리미엄 스위치를 켜면 기능 체크박스가 나타나고, 선택하면 featureIds hidden input이 추가된다", async () => {
    usePremiumFeatureMock.mockReturnValue({
      premiumFeatures: [buildFeature()],
      loading: false,
    });
    const user = userEvent.setup();
    const { container } = render(<ProductEditDialog product={buildProduct()} />);

    await user.click(screen.getByRole("switch", { name: /프리미엄 상품/ }));
    expect(screen.getByText("프리미엄 기능 선택")).toBeInTheDocument();

    await user.click(screen.getByLabelText("방명록"));

    expect(
      container.querySelector('input[name="featureIds"][value="feature-1"]'),
    ).not.toBeNull();

    await user.click(screen.getByLabelText("방명록"));

    expect(
      container.querySelector('input[name="featureIds"][value="feature-1"]'),
    ).toBeNull();
  });

  it("무제한 체크박스를 켜면 최대 수량 입력이 비활성 표시로 바뀌고 hidden 값이 0이 된다", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ProductEditDialog product={buildProduct({ maxQuantity: 50 })} />,
    );

    await user.click(screen.getByLabelText("무제한"));

    expect(screen.getByPlaceholderText("무제한")).toBeDisabled();
    const hidden = container.querySelector(
      'input[name="maxQuantity"]',
    ) as HTMLInputElement;
    expect(hidden.value).toBe("0");

    await user.click(screen.getByLabelText("무제한"));

    expect(screen.getByLabelText(/최대 구매 수량/)).toBeInTheDocument();
  });

  it("필드 에러가 있으면 각 필드 아래에 에러 메시지를 렌더링하고 에러 toast는 호출하지 않는다", async () => {
    vi.mocked(updateProduct).mockResolvedValue({
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력값을 확인해주세요",
        fieldErrors: { title: ["상품명을 입력해주세요."] },
      },
    });
    const user = userEvent.setup();
    render(<ProductEditDialog product={buildProduct()} />);

    await user.click(screen.getByRole("button", { name: "상품 수정" }));

    expect(
      await screen.findByText("상품명을 입력해주세요."),
    ).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
    expect(closeModalMock).not.toHaveBeenCalled();
  });

  it("수정에 성공하면 성공 메시지를 toast로 표시하고 모달을 닫는다", async () => {
    vi.mocked(updateProduct).mockResolvedValue({
      success: true,
      data: { message: "상품이 수정되었습니다." },
    });
    const user = userEvent.setup();
    render(<ProductEditDialog product={buildProduct()} />);

    await user.click(screen.getByRole("button", { name: "상품 수정" }));

    await waitFor(() =>
      expect(toast.message).toHaveBeenCalledWith("상품이 수정되었습니다."),
    );
    expect(closeModalMock).toHaveBeenCalledTimes(1);
  });

  it("필드 에러 없는 실패면 에러 메시지를 toast로 표시하고 모달을 닫지 않는다", async () => {
    vi.mocked(updateProduct).mockResolvedValue({
      success: false,
      error: { category: "INTERNAL", message: "알 수 없는 오류가 발생했습니다." },
    });
    const user = userEvent.setup();
    render(<ProductEditDialog product={buildProduct()} />);

    await user.click(screen.getByRole("button", { name: "상품 수정" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("알 수 없는 오류가 발생했습니다."),
    );
    expect(closeModalMock).not.toHaveBeenCalled();
  });
});
