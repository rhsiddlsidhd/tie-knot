import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FeatureProductBinding } from "@/core/domain/premium-feature";

const refreshMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));
vi.mock("sonner", () => ({
  toast: { error: toastErrorMock, success: toastSuccessMock },
}));
vi.mock("@/actions/setProductPremiumFeature", () => ({
  setProductPremiumFeature: vi.fn(),
}));

import { setProductPremiumFeature } from "@/actions/setProductPremiumFeature";
import { FeatureProductBindingRow } from "./FeatureProductBindingRow";

const product: FeatureProductBinding = {
  _id: "product-1",
  title: "봄맞이 청첩장",
  price: 9900,
  status: "active",
  attached: false,
};

const renderRow = (overrides?: Partial<FeatureProductBinding>) =>
  render(
    <table>
      <tbody>
        <FeatureProductBindingRow
          product={{ ...product, ...overrides }}
          featureId="feature-1"
        />
      </tbody>
    </table>,
  );

describe("FeatureProductBindingRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(setProductPremiumFeature).mockResolvedValue({
      success: true,
      data: { message: "상품에 기능을 연결했습니다." },
    });
  });

  it("상품명과 가격을 보여준다", () => {
    renderRow();

    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
    expect(screen.getByText(/9,900/)).toBeInTheDocument();
  });

  it("상품 상태에 대응하는 공통 라벨을 보여준다", () => {
    renderRow({ status: "soldOut" });

    expect(screen.getByText("품절")).toBeInTheDocument();
  });

  it("attached 상태를 체크박스에 반영한다", () => {
    renderRow({ attached: true });

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("체크하면 연결 액션을 attached: true로 호출한다", async () => {
    const user = userEvent.setup();
    renderRow({ attached: false });

    await user.click(screen.getByRole("checkbox"));

    expect(setProductPremiumFeature).toHaveBeenCalledWith({
      productId: "product-1",
      featureId: "feature-1",
      attached: true,
    });
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("체크를 해제하면 attached: false로 호출한다", async () => {
    const user = userEvent.setup();
    renderRow({ attached: true });

    await user.click(screen.getByRole("checkbox"));

    expect(setProductPremiumFeature).toHaveBeenCalledWith({
      productId: "product-1",
      featureId: "feature-1",
      attached: false,
    });
  });

  // 서버가 진실이므로 실패하면 화면 상태를 원래대로 되돌려야 한다.
  it("마지막 기능이라 막히면 서버 메시지를 알리고 체크를 되돌린다", async () => {
    const user = userEvent.setup();
    vi.mocked(setProductPremiumFeature).mockResolvedValue({
      success: false,
      error: {
        category: "VALIDATION",
        message: '"봄맞이 청첩장"의 마지막 프리미엄 기능이라 뗄 수 없습니다.',
      },
    });
    renderRow({ attached: true });

    await user.click(screen.getByRole("checkbox"));

    expect(toastErrorMock).toHaveBeenCalledWith(
      '"봄맞이 청첩장"의 마지막 프리미엄 기능이라 뗄 수 없습니다.',
    );
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
