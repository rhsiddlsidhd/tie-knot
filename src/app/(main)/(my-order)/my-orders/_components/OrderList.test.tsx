import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { OrderListPage } from "@/core/domain";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/ui/stores", () => ({
  useOrderStore: (
    selector: (s: { setOrder: (item: unknown) => void }) => unknown,
  ) => selector({ setOrder: vi.fn() }),
}));

vi.mock("@/actions", () => ({
  cancelOrder: vi.fn(),
}));

// 더보기 네트워크 왕복이 아니라 "첫 페이지를 그대로 그리는가"가 이 테스트의 대상이라
// SWR은 fallbackData를 그대로 돌려주도록 대체한다.
const { setSizeMock, mutateMock } = vi.hoisted(() => ({
  setSizeMock: vi.fn(),
  mutateMock: vi.fn(),
}));

vi.mock("swr/infinite", () => ({
  default: (
    _getKey: unknown,
    _fetcher: unknown,
    options: { fallbackData: OrderListPage[] },
  ) => ({
    data: options.fallbackData,
    error: undefined as unknown,
    size: 1,
    setSize: setSizeMock,
    isValidating: false,
    mutate: mutateMock,
  }),
}));

import { OrderList } from "./OrderList";

const EMPTY_PAGE: OrderListPage = { items: [], nextCursor: null };

describe("OrderList", () => {
  it("주문 자체가 없으면 첫 주문을 유도한다", () => {
    render(<OrderList firstPage={EMPTY_PAGE} />);

    expect(screen.getByText("주문 내역이 없습니다.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "청첩장 보러가기" }),
    ).toBeInTheDocument();
  });

  it("필터 결과만 0건이면 필터 초기화를 안내한다", () => {
    render(<OrderList firstPage={EMPTY_PAGE} status="CANCELLED" />);

    expect(screen.getByText("조건에 맞는 주문이 없습니다.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "필터 초기화" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("주문 내역이 없습니다.")).toBeNull();
  });

  it("다음 커서가 있으면 더보기 버튼을 보여준다", () => {
    render(
      <OrderList
        firstPage={{
          items: [
            {
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
                category: "invitation",
                title: "봄맞이 청첩장",
                thumbnail: "https://example.com/thumb.jpg",
                pricing: { originalPrice: 10000, discountedPrice: 9000 },
                quantity: 1,
                selectedFeatures: [],
              },
            },
          ],
          nextCursor: "next-cursor",
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "더보기" })).toBeInTheDocument();
    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
  });
});
