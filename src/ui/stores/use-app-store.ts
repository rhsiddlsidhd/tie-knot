"use client";

import { useContext } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { AppStoreContext } from "./provider";
import type { OrderSlice } from "./slices/order.slice";
import type { AdminModalPropsMap, AdminModalSlice, AdminModalType } from "./slices/admin-modal.slice";
import type { GuestbookModalSlice, GuestbookModalType } from "./slices/guestbook-modal.slice";

const useAppStoreApi = () => {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error("StoreProvider is missing!");
  return store;
}

const useOrderStore = <T>(selector: (state: OrderSlice) => T): T => {
  return useStore(useAppStoreApi(), selector);
}

interface AdminModalView {
  isOpen: AdminModalSlice["adminModalIsOpen"];
  type: AdminModalSlice["adminModalType"];
  props: AdminModalSlice["props"];
  openModal: AdminModalSlice["openModal"];
  closeModal: AdminModalSlice["closeAdminModal"];
}

const useAdminModalStore = <T>(selector: (state: AdminModalView) => T): T => {
  const store = useAppStoreApi();
  return useStore(store, (s) =>
    selector({
      isOpen: s.adminModalIsOpen,
      type: s.adminModalType,
      props: s.props,
      openModal: s.openModal,
      closeModal: s.closeAdminModal,
    }),
  );
}

interface GuestbookModalView {
  isOpen: GuestbookModalSlice["guestbookModalIsOpen"];
  type: GuestbookModalSlice["guestbookModalType"];
  payload: GuestbookModalSlice["payload"];
  setIsOpen: GuestbookModalSlice["setIsOpen"];
  closeModal: GuestbookModalSlice["closeGuestbookModal"];
  clearIsOpen: GuestbookModalSlice["clearIsOpen"];
}

const identityGuestbookModalView = (state: GuestbookModalView) => state;

const useGuestbookModalStore = <T = GuestbookModalView>(
  selector: (state: GuestbookModalView) => T = identityGuestbookModalView as (
    state: GuestbookModalView,
  ) => T,
): T => {
  const store = useAppStoreApi();
  return useStore(
    store,
    useShallow((s) =>
      selector({
        isOpen: s.guestbookModalIsOpen,
        type: s.guestbookModalType,
        payload: s.payload,
        setIsOpen: s.setIsOpen,
        closeModal: s.closeGuestbookModal,
        clearIsOpen: s.clearIsOpen,
      }),
    ),
  );
}

export {
  useOrderStore,
  useAdminModalStore,
  useGuestbookModalStore,
  type AdminModalPropsMap,
  type AdminModalType,
  type GuestbookModalType,
};
