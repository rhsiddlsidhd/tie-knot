import { createStore } from "zustand/vanilla";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CheckoutItem } from "@/core/domain";
import { createOrderSlice, type OrderSlice } from "./slices/order.slice";
import {
  createAdminModalSlice,
  type AdminModalSlice,
} from "./slices/admin-modal.slice";
import {
  createGuestbookModalSlice,
  type GuestbookModalSlice,
} from "./slices/guestbook-modal.slice";

export type AppStore = OrderSlice & AdminModalSlice & GuestbookModalSlice;

export const createAppStore = () =>
  createStore<AppStore>()(
    persist(
      (...a) => ({
        ...createOrderSlice(...a),
        ...createAdminModalSlice(...a),
        ...createGuestbookModalSlice(...a),
      }),
      {
        name: "order-storage",
        storage: createJSONStorage(() => sessionStorage),
        version: 1,
        // v1: CheckoutItem에 필수 category 필드가 추가됨 — 그 이전(version < 1)에
        // persist된 order는 category가 없어 그대로 두면 배송 필요 여부 판단과
        // FormData 직렬화가 깨진다. 버려서 사용자가 상품 페이지에서 다시 담게 한다.
        migrate: (persistedState): Pick<AppStore, "order" | "resumePayment"> => {
          const state = persistedState as Pick<AppStore, "order" | "resumePayment">;
          return { ...state, order: null as CheckoutItem | null };
        },
        partialize: (state): Pick<AppStore, "order" | "resumePayment"> => ({
          order: state.order,
          resumePayment: state.resumePayment,
        }),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      },
    ),
  );

export type AppStoreApi = ReturnType<typeof createAppStore>;
