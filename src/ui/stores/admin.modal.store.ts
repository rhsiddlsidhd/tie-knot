import type { PremiumFeature, Product } from "@/core/domain";

import { create } from "zustand";

export interface ModalPropsMap {
  "EDIT-PRODUCT": { product: Product };
  "EDIT-PREMIUMFEATURE": { premiumFeature: PremiumFeature };
}

type ModalType = keyof ModalPropsMap;

export interface AdminModalState {
  isOpen: boolean;
  type: null | ModalType;
  props: ModalPropsMap[ModalType] | Record<string, never>;
}

interface AdminModalAction {
  openModal: <T extends ModalType>(type: T, props: ModalPropsMap[T]) => void;
  closeModal: () => void;
}

const initialState: AdminModalState = {
  isOpen: false,
  type: null,
  props: {},
};

export const useAdminModalStore = create<AdminModalState & AdminModalAction>(
  (set) => ({
    ...initialState,
    openModal: (type, props) => set(() => ({ isOpen: true, type, props })),
    closeModal: () => set(() => ({ ...initialState, isOpen: false })),
  }),
);
