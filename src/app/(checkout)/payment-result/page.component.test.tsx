import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// PaymentResult 컨테이너 자체의 behavior(로딩/성공/실패 분기, completePayment 호출)는
// PaymentResult.component.test.tsx가 이미 검증한다 — README의 "상위 레이어 테스트로
// 하위 레이어의 모든 behavior를 반복해서 검증하지 않는다" 원칙에 따라 이 page 테스트는
// searchParams → PaymentResult props 전달만 확인한다.
vi.mock("@/app/(checkout)/payment-result/_containers/PaymentResult", () => ({
  PaymentResult: ({ paymentId }: { paymentId?: string }) => (
    <div>Container:paymentId={String(paymentId)}</div>
  ),
}));

import PaymentResultPage from "./page";

describe("결제 결과 페이지", () => {
  it("searchParams의 paymentId를 PaymentResult에 그대로 전달한다", async () => {
    render(
      await PaymentResultPage({
        searchParams: Promise.resolve({ paymentId: "order-1" }),
      }),
    );

    expect(screen.getByText("Container:paymentId=order-1")).toBeInTheDocument();
  });

  it("paymentId가 없으면 undefined를 그대로 전달한다", async () => {
    render(await PaymentResultPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByText("Container:paymentId=undefined"),
    ).toBeInTheDocument();
  });
});
