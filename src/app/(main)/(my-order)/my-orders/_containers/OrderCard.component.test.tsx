import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OrderListItem } from "@/core/domain/order";

const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

vi.mock("@/ui/stores/use-app-store", () => ({
  useOrderStore: (
    selector: (s: { setOrder: (item: unknown) => void }) => unknown,
  ) => selector({ setOrder: vi.fn() }),
}));

vi.mock("@/actions/cancelOrder", () => ({
  cancelOrder: vi.fn(),
}));

import { cancelOrder } from "@/actions/cancelOrder";
import { OrderCard } from "./OrderCard";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";

const buildOrder = (overrides?: Partial<OrderListItem>): OrderListItem =>
  ({
    _id: "order-1",
    merchantUid: "ORDER-1",
    userId: "user-1",
    buyerName: "김철수",
    buyerEmail: "buyer@example.com",
    buyerPhone: "010-1234-5678",
    finalPrice: 9000,
    discountRate: 0,
    discountAmount: 0,
    payMethod: "CARD",
    orderStatus: "PENDING",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    product: {
      productId: "product-1",
      category: MOBILE_INVITATION_CATEGORY,
      title: "봄맞이 청첩장",
      thumbnail: "https://example.com/thumb.jpg",
      pricing: { originalPrice: 10000, discountedPrice: 9000 },
      quantity: 1,
      selectedFeatures: [],
    },
    ...overrides,
  }) as unknown as OrderListItem;

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

// 주문 메뉴를 열고 "주문 취소"를 골라 확인창까지 진행한다.
const openCancelConfirm = async (onOrderChanged?: () => void) => {
  const user = userEvent.setup();
  render(<OrderCard order={buildOrder()} onOrderChanged={onOrderChanged} />);

  await user.click(screen.getByRole("button", { name: "주문 메뉴" }));
  await user.click(screen.getByRole("menuitem", { name: "주문 취소" }));

  return user;
};

describe("OrderCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("결제창을 벗어난 PENDING 주문은 결제하기 버튼을 보여준다", () => {
    render(<OrderCard order={buildOrder()} />);

    expect(
      screen.getByRole("button", { name: "결제하기" }),
    ).toBeInTheDocument();
    expect(screen.getByText("주문대기")).toBeInTheDocument();
  });

  it("가상계좌가 발급된 PENDING 주문은 결제하기 대신 입금 안내를 보여준다", () => {
    render(
      <OrderCard
        order={buildOrder({
          paymentId: "payment-1",
          payMethod: "VIRTUAL_ACCOUNT",
          virtualAccount: {
            bank: "신한은행",
            accountNumber: "110-123-456789",
            expiredAt: new Date("2026-08-03T23:59:00.000Z"),
          },
        })}
      />,
    );

    expect(screen.queryByRole("button", { name: "결제하기" })).toBeNull();
    expect(screen.getByText("입금대기")).toBeInTheDocument();
    expect(screen.getByText(/110-123-456789/)).toBeInTheDocument();
    expect(screen.getByText(/입금액 9,000원/)).toBeInTheDocument();
  });

  it("가상계좌 주문은 결제 동기화 전(paymentId 없음)에도 결제하기를 숨긴다", () => {
    render(
      <OrderCard order={buildOrder({ payMethod: "VIRTUAL_ACCOUNT" })} />,
    );

    expect(screen.queryByRole("button", { name: "결제하기" })).toBeNull();
    expect(screen.getByText("입금대기")).toBeInTheDocument();
  });

  it("취소된 주문은 취소 사유와 시각을 보여준다", () => {
    render(
      <OrderCard
        order={buildOrder({
          orderStatus: "CANCELLED",
          cancelledAt: new Date("2026-08-02T09:30:00.000Z"),
          cancelReason: "결제 미완료로 인한 자동 취소",
        })}
      />,
    );

    expect(
      screen.getByText(/결제 미완료로 인한 자동 취소/),
    ).toBeInTheDocument();
  });

  it("발행된 청첩장이 있으면 공개 링크 복사 버튼을 보여준다", () => {
    render(
      <OrderCard
        order={buildOrder({
          orderStatus: "COMPLETED",
          invitationStatus: "published",
          invitationPublicKey: "public-key-1",
        })}
      />,
    );

    expect(
      screen.getByRole("button", { name: /공개 링크 복사/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("발행완료")).toBeInTheDocument();
  });

  it("주문 취소를 고르면 메뉴가 닫히고 되돌릴 수 없음을 알리는 확인창이 열린다", async () => {
    await openCancelConfirm();

    expect(screen.queryByRole("menu")).toBeNull();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("봄맞이 청첩장");
    expect(dialog).toHaveTextContent("복구할 수 없습니다");
    expect(cancelOrder).not.toHaveBeenCalled();
  });

  it("확인창을 취소하면 주문을 취소하지 않고 주문 메뉴 버튼으로 포커스가 돌아온다", async () => {
    const user = await openCancelConfirm();

    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "취소",
      }),
    );

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(cancelOrder).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "주문 메뉴" })).toHaveFocus();
  });

  it("주문 취소를 확인하면 cancelOrder 후 목록 캐시와 라우터를 갱신하고 포커스를 되돌린다", async () => {
    vi.mocked(cancelOrder).mockResolvedValue({
      success: true,
      data: { orderId: "order-1" },
    });
    const onOrderChanged = vi.fn();
    const user = await openCancelConfirm(onOrderChanged);

    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "주문 취소",
      }),
    );

    expect(cancelOrder).toHaveBeenCalledWith("order-1");
    expect(onOrderChanged).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("button", { name: "주문 메뉴" })).toHaveFocus();
  });

  it("주문 취소에 실패하면 확인창을 열어둔 채 재시도할 수 있다", async () => {
    vi.mocked(cancelOrder).mockResolvedValue({
      success: false,
      error: { category: "INTERNAL", message: "취소에 실패했습니다." },
    });
    const user = await openCancelConfirm();

    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "주문 취소",
      }),
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("취소가 진행되는 동안 확인 버튼을 다시 눌러도 cancelOrder를 중복 호출하지 않는다", async () => {
    const deferred = createDeferred<{ success: true; data: { orderId: string } }>();
    vi.mocked(cancelOrder).mockReturnValue(deferred.promise);
    const user = await openCancelConfirm();

    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "주문 취소" }));
    await user.click(within(dialog).getByRole("button", { name: "취소 중..." }));

    expect(cancelOrder).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve({ success: true, data: { orderId: "order-1" } });
    });
  });
});
