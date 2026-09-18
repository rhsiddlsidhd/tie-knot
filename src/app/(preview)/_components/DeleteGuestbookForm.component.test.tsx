import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Dialog, DialogContent } from "@/ui/components/atoms/dialog";
import type { ApiResponse } from "@/core/domain/error";
import { DeleteGuestbookForm } from "./DeleteGuestbookForm";

type Props = React.ComponentProps<typeof DeleteGuestbookForm>;

// 순수 organism이 Radix DialogTitle/DialogFooter/DialogClose 등을 쓰므로,
// 실제 GuestbookModal과 동일하게 Dialog 컨텍스트 안에서 렌더해야 한다.
const renderForm = (overrides: Partial<Props> = {}) => {
  const props: Props = {
    guestbookId: "entry-1",
    publicKey: "public-key-1",
    action: vi.fn(),
    pending: false,
    state: null,
    ...overrides,
  };
  render(
    <Dialog open>
      <DialogContent>
        <DeleteGuestbookForm {...props} />
      </DialogContent>
    </Dialog>,
  );
  return props;
};

describe("DeleteGuestbookForm (프레젠테이션)", () => {
  it("비밀번호 입력 필드와 취소·전송 버튼을 렌더링한다", () => {
    renderForm();

    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "전송" })).toBeInTheDocument();
  });

  it("비밀번호와 hidden guestbookId/publicKey를 FormData에 담아 action을 호출한다", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    renderForm({
      action,
      guestbookId: "entry-42",
      publicKey: "invitation-key",
    });

    await user.type(screen.getByLabelText("비밀번호"), "1234");
    await user.click(screen.getByRole("button", { name: "전송" }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][0] as FormData;
    expect(formData.get("password")).toBe("1234");
    expect(formData.get("guestbookId")).toBe("entry-42");
    expect(formData.get("publicKey")).toBe("invitation-key");
  });

  it("pending이 true면 제출 버튼 라벨이 삭제 중으로 바뀐다", () => {
    renderForm({ pending: true });

    expect(
      screen.getByRole("button", { name: "삭제 중..." }),
    ).toBeInTheDocument();
  });

  it("pending이 false면 제출 버튼 라벨이 전송으로 표시된다", () => {
    renderForm({ pending: false });

    expect(screen.getByRole("button", { name: "전송" })).toBeInTheDocument();
  });

  it("password 필드 에러가 있으면 에러 메시지를 표시한다", () => {
    const state: ApiResponse<{ message: string }> = {
      success: false,
      error: {
        category: "VALIDATION",
        message: "비밀번호 또는 게시글 ID 형식이 올바르지 않습니다.",
        fieldErrors: {
          password: ["비밀번호는 최소 4자 이상이어야 합니다"],
        },
      },
    };
    renderForm({ state });

    expect(
      screen.getByText("비밀번호는 최소 4자 이상이어야 합니다"),
    ).toBeInTheDocument();
  });

  it("필드 에러가 없으면 에러 메시지를 표시하지 않는다", () => {
    renderForm({ state: null });

    expect(
      screen.queryByText("비밀번호는 최소 4자 이상이어야 합니다"),
    ).not.toBeInTheDocument();
  });
});
