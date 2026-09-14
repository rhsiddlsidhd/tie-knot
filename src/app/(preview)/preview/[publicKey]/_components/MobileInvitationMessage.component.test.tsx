import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createAppStore } from "@/ui/stores/app.store";
import { StoreProvider } from "@/ui/stores/provider";
import { MobileInvitationMessage } from "./MobileInvitationMessage";
import type { MobileInvitationMessageMappedProps } from "../_utils/mobileInvitationMessage.mapper";

const parties: MobileInvitationMessageMappedProps["parties"] = [
  {
    title: "신랑",
    name: "김철수",
    parents: [
      { label: "아버님", name: "김영수" },
      { label: "어머님", name: "박정순" },
    ],
    contacts: [{ relation: "신랑", name: "김철수", phone: "010-1111-2222" }],
  },
  {
    title: "신부",
    name: "이영희",
    parents: [],
    contacts: [{ relation: "신부", name: "이영희", phone: "010-3333-4444" }],
  },
];

const renderWithStore = () => {
  const testStore = createAppStore();
  const utils = render(
    <StoreProvider store={testStore}>
      <MobileInvitationMessage parties={parties} />
    </StoreProvider>,
  );
  return { ...utils, testStore };
}

describe("MobileInvitationMessage", () => {
  it("각 party의 이름과 부모 정보를 렌더링한다", () => {
    renderWithStore();

    expect(screen.getByText("김철수")).toBeInTheDocument();
    expect(screen.getByText("김영수")).toBeInTheDocument();
    expect(screen.getByText("박정순")).toBeInTheDocument();
    expect(screen.getByText("이영희")).toBeInTheDocument();
  });

  it("부모 정보가 없는 party는 부모 라벨을 렌더링하지 않는다", () => {
    renderWithStore();

    // parties[1](신부)은 parents가 비어 있으므로, 전체 문서의 "아버님"/"어머님"
    // 라벨은 parties[0](신랑) 쪽에서만 각 1번씩 나와야 한다.
    expect(screen.getAllByText("아버님")).toHaveLength(1);
    expect(screen.getAllByText("어머님")).toHaveLength(1);
  });

  it("연락하기 버튼을 클릭하면 해당 party의 연락처로 VIEW_CONTACT 모달을 연다", async () => {
    const user = userEvent.setup();
    const { testStore } = renderWithStore();

    await user.click(screen.getByRole("button", { name: "신부측 연락하기" }));

    expect(testStore.getState().guestbookModalIsOpen).toBe(true);
    expect(testStore.getState().guestbookModalType).toBe("VIEW_CONTACT");
    expect(testStore.getState().payload).toEqual(parties[1].contacts);
  });
});
