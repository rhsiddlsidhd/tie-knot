import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CheckoutItem } from "@/core/domain";
import type { PayStatus } from "@/core/domain";
import type { CreateOrderResult } from "@/actions";

interface OrderState {
  order: CheckoutItem | null;
  setOrder: (orderData: CheckoutItem) => void;
  clearOrder: () => void;
  paymentStatus: PayStatus | "IDLE";
  setPaymentStatus: (status: PayStatus | "IDLE") => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  // PENDING 주문 재결제(GH #78) — PG상 진짜 미결제로 확인된 기존 주문을 같은
  // merchantUid로 재시도할 때 PaymentButton이 채우고, CheckoutForm이 이 값이
  // 있으면 buyer info 폼 대신 재결제 확인 뷰를 렌더한다.
  resumePayment: CreateOrderResult | null;
  setResumePayment: (data: CreateOrderResult) => void;
  clearResumePayment: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      order: null as CheckoutItem | null,
      // order 트리거 시점(구매하기/결제하기)과 paymentStatus 트리거 시점(체크아웃 폼 제출)이
      // 서로 달라, 리셋 안 하면 이전 결제 시도의 상태가 새 주문으로 새어 들어간다. 같은 이유로
      // resumePayment도 같이 리셋한다 — 안 하면 새 주문(구매하기)에 이전 재결제 시도가 새어든다.
      setOrder: (orderData) =>
        set({ order: orderData, paymentStatus: "IDLE", resumePayment: null }),
      clearOrder: () => set({ order: null, resumePayment: null }),
      paymentStatus: "IDLE",
      setPaymentStatus: (status) => set({ paymentStatus: status }),
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      resumePayment: null as CreateOrderResult | null,
      setResumePayment: (data) => set({ resumePayment: data }),
      clearResumePayment: () => set({ resumePayment: null }),
    }),
    {
      name: "order-storage",
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
      // v1: CheckoutItem에 필수 category 필드가 추가됨 — 그 이전(version < 1)에
      // persist된 order는 category가 없어 그대로 두면 배송 필요 여부 판단과
      // FormData 직렬화가 깨진다. 버려서 사용자가 상품 페이지에서 다시 담게 한다.
      migrate: (persistedState) => {
        const state = persistedState as Pick<OrderState, "order" | "resumePayment">;
        return { ...state, order: null };
      },
      partialize: (state): Pick<OrderState, "order" | "resumePayment"> => ({
        order: state.order,
        resumePayment: state.resumePayment,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
