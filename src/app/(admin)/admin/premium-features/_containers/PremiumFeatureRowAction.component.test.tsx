import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PremiumFeature } from "@/core/domain/premium-feature";

const openModalMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());

vi.mock("@/ui/stores/use-app-store", () => ({
  useAdminModalStore: (selector: (state: unknown) => unknown) =>
    selector({ openModal: openModalMock }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
  toast: { error: toastErrorMock, success: toastSuccessMock },
}));

vi.mock("@/actions/deletePremiumFeature", () => ({
  deletePremiumFeature: vi.fn(),
}));

import { deletePremiumFeature } from "@/actions/deletePremiumFeature";
import { PremiumFeatureRowAction } from "./PremiumFeatureRowAction";

const feature: PremiumFeature = {
  _id: "feature-1",
  code: "GUESTBOOK",
  label: "방명록",
  description: "하객들이 남기는 방명록 기능을 추가합니다.",
  additionalPrice: 3000,
  isActive: true,
  createdAt: new Date("2026-08-01T00:00:00.000Z").toISOString(),
};

const dialogButton = (name: string) =>
  within(screen.getByRole("alertdialog")).getByRole("button", { name });

describe("PremiumFeatureRowAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("수정 버튼을 누르면 해당 기능으로 편집 모달을 연다", async () => {
    const user = userEvent.setup();
    render(<PremiumFeatureRowAction premiumFeature={feature} />);

    await user.click(screen.getByRole("button", { name: "기능 수정" }));

    expect(openModalMock).toHaveBeenCalledWith("EDIT-PREMIUMFEATURE", {
      premiumFeature: feature,
    });
  });

  it("렌더 시점에는 모달과 확인창을 열지 않는다", () => {
    render(<PremiumFeatureRowAction premiumFeature={feature} />);

    expect(openModalMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("삭제 확인창은 기능 라벨과 복구 불가를 알린다", async () => {
    const user = userEvent.setup();
    render(<PremiumFeatureRowAction premiumFeature={feature} />);

    await user.click(screen.getByRole("button", { name: "기능 삭제" }));

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("방명록");
    expect(dialog).toHaveTextContent("복구할 수 없습니다");
  });

  it("확인하면 deletePremiumFeature를 호출하고 목록을 새로고침한다", async () => {
    const user = userEvent.setup();
    vi.mocked(deletePremiumFeature).mockResolvedValue({
      success: true,
      data: { message: "프리미엄 기능이 삭제되었습니다." },
    });

    render(<PremiumFeatureRowAction premiumFeature={feature} />);

    await user.click(screen.getByRole("button", { name: "기능 삭제" }));
    await user.click(dialogButton("삭제"));

    expect(deletePremiumFeature).toHaveBeenCalledWith("feature-1");
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "프리미엄 기능이 삭제되었습니다.",
    );
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("삭제를 취소하면 액션을 호출하지 않는다", async () => {
    const user = userEvent.setup();
    render(<PremiumFeatureRowAction premiumFeature={feature} />);

    await user.click(screen.getByRole("button", { name: "기능 삭제" }));
    await user.click(dialogButton("취소"));

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(deletePremiumFeature).not.toHaveBeenCalled();
  });

  it("참조 상품 때문에 실패하면 서버 메시지를 알리고 확인창을 열어둔다", async () => {
    const user = userEvent.setup();
    vi.mocked(deletePremiumFeature).mockResolvedValue({
      success: false,
      error: {
        category: "VALIDATION",
        message:
          '이 기능을 사용 중인 상품이 있어 삭제할 수 없습니다: "봄맞이 청첩장"',
      },
    });

    render(<PremiumFeatureRowAction premiumFeature={feature} />);

    await user.click(screen.getByRole("button", { name: "기능 삭제" }));
    await user.click(dialogButton("삭제"));

    expect(toastErrorMock).toHaveBeenCalledWith(
      '이 기능을 사용 중인 상품이 있어 삭제할 수 없습니다: "봄맞이 청첩장"',
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
  it("상품 연결 화면으로 가는 링크를 제공한다", () => {
    render(<PremiumFeatureRowAction premiumFeature={feature} />);

    expect(screen.getByRole("link", { name: "연결 상품" })).toHaveAttribute(
      "href",
      "/admin/premium-features/feature-1/products",
    );
  });
});
