import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Dialog, DialogContent } from "@/ui/components/atoms/dialog";
import type { APIResponse } from "@/core/domain/error";
import { CreateGuestbookForm } from "./CreateGuestbookForm";

type Props = React.ComponentProps<typeof CreateGuestbookForm>;

// 순수 organism이 Radix DialogTitle/DialogFooter/DialogClose 등을 쓰므로,
// 실제 GuestbookModal과 동일하게 Dialog 컨텍스트 안에서 렌더해야 한다.
const renderForm = (overrides: Partial<Props> = {}) => {
  const props: Props = {
    publicKey: "public-key-1",
    action: vi.fn(),
    pending: false,
    state: null,
    ...overrides,
  };
  render(
    <Dialog open>
      <DialogContent>
        <CreateGuestbookForm {...props} />
      </DialogContent>
    </Dialog>,
  );
  return props;
};

describe("CreateGuestbookForm (프레젠테이션)", () => {
  it("이름·비밀번호·메시지 입력 필드와 비밀글 스위치, 제출 버튼을 렌더링한다", () => {
    renderForm();

    expect(screen.getByLabelText("이름")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
    expect(screen.getByLabelText("메시지")).toBeInTheDocument();
    expect(screen.getByLabelText("비밀글")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "축하 글 전달하기" }),
    ).toBeInTheDocument();
  });

  it("입력값과 hidden publicKey를 FormData에 담아 action을 호출한다", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    renderForm({ action, publicKey: "invitation-key" });

    await user.type(screen.getByLabelText("이름"), "하객1");
    await user.type(screen.getByLabelText("비밀번호"), "1234");
    await user.type(screen.getByLabelText("메시지"), "축하합니다");
    await user.click(screen.getByRole("button", { name: "축하 글 전달하기" }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get("author")).toBe("하객1");
    expect(formData.get("password")).toBe("1234");
    expect(formData.get("message")).toBe("축하합니다");
    expect(formData.get("publicKey")).toBe("invitation-key");
  });

  it("비밀글 스위치를 켜면 isPrivate가 FormData에 담겨 action에 전달된다", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    renderForm({ action });

    await user.type(screen.getByLabelText("이름"), "하객1");
    await user.type(screen.getByLabelText("비밀번호"), "1234");
    await user.type(screen.getByLabelText("메시지"), "축하합니다");
    await user.click(screen.getByLabelText("비밀글"));
    await user.click(screen.getByRole("button", { name: "축하 글 전달하기" }));

    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get("isPrivate")).toBe("on");
  });

  it("pending이 true면 제출 버튼을 비활성화하고 전송 중 라벨을 보여준다", () => {
    renderForm({ pending: true });

    const button = screen.getByRole("button", { name: "전송 중..." });
    expect(button).toBeDisabled();
  });

  it("pending이 false면 제출 버튼을 활성화하고 기본 라벨을 보여준다", () => {
    renderForm({ pending: false });

    const button = screen.getByRole("button", { name: "축하 글 전달하기" });
    expect(button).toBeEnabled();
  });

  it("author/password 필드 에러가 있으면 각 필드 아래에 에러 메시지를 표시한다", () => {
    const state: APIResponse<{ message: string }> = {
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력값을 확인해주세요",
        fieldErrors: {
          author: ["이름을 입력해주세요"],
          password: ["비밀번호는 최소 4자 이상이어야 합니다"],
        },
      },
    };
    renderForm({ state });

    expect(screen.getByText("이름을 입력해주세요")).toBeInTheDocument();
    expect(
      screen.getByText("비밀번호는 최소 4자 이상이어야 합니다"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("이름")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("비밀번호")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("필드 에러가 없으면 에러 메시지를 표시하지 않는다", () => {
    renderForm({ state: null });

    expect(screen.queryByText("이름을 입력해주세요")).not.toBeInTheDocument();
  });
});
