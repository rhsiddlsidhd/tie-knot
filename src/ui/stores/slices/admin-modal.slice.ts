import type { StateCreator } from "zustand";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import type { Product } from "@/core/domain/product";
import type { AppStore } from "../app.store";

export interface AdminModalPropsMap {
  "EDIT-PRODUCT": { product: Product };
  "EDIT-PREMIUMFEATURE": { premiumFeature: PremiumFeature };
}

export type AdminModalType = keyof AdminModalPropsMap;

// isOpen/type/closeModal은 guestbook-modal.slice와 결합 시 충돌해 접두사를 붙였다.
// props는 다른 슬라이스와 겹치지 않아 그대로 둔다.
export interface AdminModalSlice {
  adminModalIsOpen: boolean;
  adminModalType: null | AdminModalType;
  props: AdminModalPropsMap[AdminModalType] | Record<string, never>;
  openModal: <T extends AdminModalType>(type: T, props: AdminModalPropsMap[T]) => void;
  closeAdminModal: () => void;
}

const initialAdminModalState: Pick<
  AdminModalSlice,
  "adminModalIsOpen" | "adminModalType" | "props"
> = {
  adminModalIsOpen: false,
  adminModalType: null,
  props: {},
};

export const createAdminModalSlice: StateCreator<
  AppStore,
  [],
  [],
  AdminModalSlice
> = (set) => ({
  ...initialAdminModalState,
  openModal: (type, props) =>
    set({ adminModalIsOpen: true, adminModalType: type, props }),
  closeAdminModal: () => set({ ...initialAdminModalState, adminModalIsOpen: false }),
});
