import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AdminOrderListPage } from "@/core/domain/order";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { AdminOrdersTemplate } from "./AdminOrdersTemplate";

const buildPage = (
  overrides?: Partial<AdminOrderListPage>,
): AdminOrderListPage => ({
  items: [
    {
      id: "order-1",
      merchantUid: "TK-20260821-0142",
      buyerName: "김민준",
      productTitle: "봄빛 청첩장 세트",
      orderStatus: "CONFIRMED",
      finalPrice: 31000,
      createdAt: new Date("2026-08-19T15:30:00.000Z"), // KST 2026-08-20
    },
  ],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
  ...overrides,
});

describe("AdminOrdersTemplate", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("상태 필터를 변경하면 해당 status query로 이동한다", async () => {
    const user = userEvent.setup();
    render(<AdminOrdersTemplate page={buildPage()} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "결제완료" }));

    expect(pushMock).toHaveBeenCalledWith("/admin/orders?status=CONFIRMED");
  });

  it("전체 상태를 선택하면 status query가 제거된다", async () => {
    const user = userEvent.setup();
    render(<AdminOrdersTemplate page={buildPage()} status="CONFIRMED" />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "전체 상태" }));

    expect(pushMock).toHaveBeenCalledWith("/admin/orders");
  });

  it("주문 행을 실제 props 기준으로 렌더링하고 주문일을 KST로 표시한다", () => {
    render(<AdminOrdersTemplate page={buildPage()} />);

    expect(screen.getByText("TK-20260821-0142")).toBeInTheDocument();
    expect(screen.getByText("김민준")).toBeInTheDocument();
    expect(screen.getByText("봄빛 청첩장 세트")).toBeInTheDocument();
    expect(screen.getByText("31,000원")).toBeInTheDocument();
    expect(screen.getByText("2026.8.20")).toBeInTheDocument();
  });

  it("주문 상태 Badge를 렌더링한다", () => {
    render(<AdminOrdersTemplate page={buildPage()} />);

    expect(screen.getByText("결제완료")).toBeInTheDocument();
  });

  it("항목이 없으면 빈 상태 UI를 보여준다", () => {
    render(<AdminOrdersTemplate page={buildPage({ items: [] })} />);

    expect(
      screen.getByText("조건에 해당하는 주문이 없습니다"),
    ).toBeInTheDocument();
  });

  it("offset 전환 중에는 기존 cursor 페이지 이동을 비활성화한다", () => {
    render(<AdminOrdersTemplate page={buildPage()} />);
    expect(screen.getByRole("button", { name: "다음 페이지" })).toBeDisabled();
  });
});
