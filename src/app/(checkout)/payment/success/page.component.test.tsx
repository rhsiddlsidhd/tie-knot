import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { redirectMock, verifySessionMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  verifySessionMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/services/auth", () => ({
  verifySession: verifySessionMock,
}));

// PaymentSuccessTemplate 자체의 behavior(주문번호/링크 렌더링)는
// PaymentSuccessTemplate.component.test.tsx가 이미 검증한다 — README의 "상위 레이어
// 테스트로 하위 레이어의 모든 behavior를 반복해서 검증하지 않는다" 원칙에 따라 이 page
// 테스트는 orderId 분기(redirect 또는 props 전달)만 확인한다.
vi.mock(
  "@/app/(checkout)/payment/success/_components/PaymentSuccessTemplate",
  () => ({
    PaymentSuccessTemplate: ({ orderId }: { orderId: string }) => (
      <div>Template:orderId={orderId}</div>
    ),
  }),
);

import PaymentSuccessPage from "./page";

describe("결제 성공 페이지", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("orderId가 없으면 홈으로 redirect하고 Template을 렌더링하지 않는다", async () => {
    await expect(
      PaymentSuccessPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("orderId가 있으면 그 값을 Template props로 전달한다", async () => {
    render(
      await PaymentSuccessPage({
        searchParams: Promise.resolve({ orderId: "order-1" }),
      }),
    );

    expect(screen.getByText("Template:orderId=order-1")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
