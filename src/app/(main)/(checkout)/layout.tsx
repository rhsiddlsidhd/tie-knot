import { PageTitle } from "@/ui/components/molecules";
import { OrderSummary } from "@/ui/components/organisms";
import React from "react";

const CheckoutLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="mx-auto max-w-6xl">
          <PageTitle />

          <div className="grid gap-8 lg:grid-cols-3">
            {/* 모바일: 요약이 맨 위(order-first) → 폼이 이어짐. 데스크톱(lg): 순서 원복해서
                DOM 순서 그대로(폼 왼쪽, 요약 오른쪽 사이드바) 2열 배치 — 결제 화면 구조 확정
                (feat/brand-design-tokens plan) 참고. */}
            <div className="lg:col-span-2">{children}</div>

            <div className="order-first lg:order-none lg:col-span-1">
              <OrderSummary />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CheckoutLayout;
