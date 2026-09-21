import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { setMobileInvitationStatusMock } = vi.hoisted(() => ({
  setMobileInvitationStatusMock: vi.fn(),
}));

vi.mock("@/actions/setMobileInvitationStatus", () => ({
  setMobileInvitationStatus: setMobileInvitationStatusMock,
}));

import { MobileInvitationStatusControls } from "./MobileInvitationStatusControls";

describe("MobileInvitationStatusControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("청첩장을 저장한 적 없으면 안내 문구만 보여준다", () => {
    render(<MobileInvitationStatusControls orderId="order-1" />);

    expect(
      screen.getByText("청첩장을 저장하면 미리보기와 발행 기능을 사용할 수 있습니다."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("draft 상태면 계좌 정보만 비어도 된다는 경고를 보여준다 (이미지는 더 이상 언급하지 않는다)", () => {
    render(<MobileInvitationStatusControls orderId="order-1" status="draft" />);

    expect(
      screen.getByText("계좌 정보가 비어 있어도 발행할 수 있습니다. 공개 전 내용을 확인해 주세요."),
    ).toBeInTheDocument();
  });

  it("발행하기를 누르면 published로 전환하고 라벨이 발행 취소로 바뀐다", async () => {
    setMobileInvitationStatusMock.mockResolvedValue({
      success: true,
      data: { publicKey: "pub-1", status: "published" },
    });
    const user = userEvent.setup();
    render(<MobileInvitationStatusControls orderId="order-1" status="draft" />);

    await user.click(screen.getByRole("button", { name: "발행하기" }));

    expect(setMobileInvitationStatusMock).toHaveBeenCalledWith("order-1", "published");
    expect(await screen.findByRole("button", { name: "발행 취소" })).toBeInTheDocument();
  });
});
