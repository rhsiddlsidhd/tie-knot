import { describe, expect, it, vi } from "vitest";
import { createStore } from "zustand/vanilla";

import type { AdminModalSlice } from "./admin-modal.slice";
import { createAdminModalSlice } from "./admin-modal.slice";

// 슬라이스만 검증한다 — 결합 store(app.store)의 persist·다른 슬라이스는 대상이 아니다.
const createAdminModalStore = () =>
  createStore<AdminModalSlice>()((...args) =>
    createAdminModalSlice(
      ...(args as unknown as Parameters<typeof createAdminModalSlice>),
    ),
  );

const premiumFeature = {
  _id: "feature-1",
  code: "GALLERY_LIGHTBOX",
  label: "갤러리 확대 보기",
  description: "사진을 크게 볼 수 있습니다.",
  additionalPrice: 3000,
  isActive: true,
  createdAt: "2026-09-01T00:00:00.000Z",
};

describe("createAdminModalSlice", () => {
  it("openModal은 모달 종류와 목록 갱신 callback을 포함한 props를 보관한다", () => {
    const store = createAdminModalStore();
    const onRefreshed = vi.fn();

    store.getState().openModal("EDIT-PREMIUMFEATURE", {
      premiumFeature,
      onRefreshed,
    });

    expect(store.getState()).toMatchObject({
      adminModalIsOpen: true,
      adminModalType: "EDIT-PREMIUMFEATURE",
      props: { premiumFeature, onRefreshed },
    });
  });

  it("closeAdminModal은 모달 상태와 props를 초기화한다", () => {
    const store = createAdminModalStore();
    const onRefreshed = vi.fn();
    store.getState().openModal("EDIT-PREMIUMFEATURE", {
      premiumFeature,
      onRefreshed,
    });

    store.getState().closeAdminModal();

    expect(store.getState()).toMatchObject({
      adminModalIsOpen: false,
      adminModalType: null,
    });
    expect(store.getState().props).toEqual({});
  });
});
