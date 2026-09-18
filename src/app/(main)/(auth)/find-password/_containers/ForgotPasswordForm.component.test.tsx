import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/actions/requestPasswordReset", () => ({
  requestPasswordReset: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { requestPasswordReset } from "@/actions/requestPasswordReset";
import { toast } from "sonner";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

describe("ForgotPasswordForm (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("재설정 요청 성공 시 전송된 이메일을 화면에 보여준다", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({
      success: true,
      data: { message: "전송됨", email: "a@b.com" },
    });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("이메일"), "a@b.com");
    await user.click(screen.getByRole("button", { name: /재설정 링크 받기/ }));

    expect(await screen.findByText("a@b.com")).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("필드 에러 없는 실패 시 toast로 에러 메시지를 보여준다", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({
      success: false,
      error: { category: "NOT_FOUND", message: "일치하는 회원이 없습니다." },
    });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("이메일"), "a@b.com");
    await user.click(screen.getByRole("button", { name: /재설정 링크 받기/ }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("일치하는 회원이 없습니다.");
    });
  });

  it("필드 에러가 있는 실패 시 toast를 띄우지 않고 필드 에러를 보여준다", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력 값을 확인해주세요.",
        fieldErrors: { email: ["유효한 이메일을 입력해주세요."] },
      },
    });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("이메일"), "invalid@example.com");
    await user.click(screen.getByRole("button", { name: /재설정 링크 받기/ }));

    expect(
      await screen.findByText("유효한 이메일을 입력해주세요."),
    ).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
