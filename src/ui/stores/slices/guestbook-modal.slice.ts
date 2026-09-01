import type { StateCreator } from "zustand";
import type { AppStore } from "../app.store";

export type GuestbookModalType =
  | "WRITE_GUESTBOOK"
  | "DELETE_GUESTBOOK"
  | "VIEW_CONTACT";

// isOpen/type/closeModal은 admin-modal.slice와 결합 시 충돌해 접두사를 붙였다.
// payload는 다른 슬라이스와 겹치지 않아 그대로 둔다.
export interface GuestbookModalSlice {
  guestbookModalIsOpen: boolean;
  guestbookModalType: GuestbookModalType | null;
  payload: unknown;
  setIsOpen: (args: {
    isOpen: boolean;
    type: GuestbookModalType;
    payload: unknown;
  }) => void;
  closeGuestbookModal: () => void;
  clearIsOpen: () => void;
}

const initialGuestbookModalState: Pick<
  GuestbookModalSlice,
  "guestbookModalIsOpen" | "guestbookModalType" | "payload"
> = {
  guestbookModalIsOpen: false,
  guestbookModalType: null,
  payload: null,
};

export const createGuestbookModalSlice: StateCreator<
  AppStore,
  [],
  [],
  GuestbookModalSlice
> = (set) => ({
  ...initialGuestbookModalState,
  setIsOpen: ({ isOpen, type, payload }) =>
    set({ guestbookModalIsOpen: isOpen, guestbookModalType: type, payload }),
  closeGuestbookModal: () => set({ guestbookModalIsOpen: false }),
  clearIsOpen: () => set({ ...initialGuestbookModalState }),
});
