import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/actions/findUserEmail", () => ({
  findUserEmail: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { findUserEmail } from "@/actions/findUserEmail";
import { toast } from "sonner";
import { FindIdForm } from "./FindIdForm";

describe("FindIdForm (컨테이너)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("아이디 찾기 성공 시 결과 이메일을 화면에 보여준다", async () => {
    vi.mocked(findUserEmail).mockResolvedValue({
      success: true,
      data: { email: "a@b.com" },
    });
    const user = userEvent.setup();
    render(<FindIdForm />);

    await user.type(screen.getByLabelText("이름"), "홍길동");
    await user.type(screen.getByLabelText("전화번호"), "010-1234-5678");
    await user.click(screen.getByRole("button", { name: /아이디 찾기/ }));

    expect(await screen.findByText("a@b.com")).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("필드 에러 없는 실패 시 toast로 에러 메시지를 보여준다", async () => {
    vi.mocked(findUserEmail).mockResolvedValue({
      success: false,
      error: { category: "NOT_FOUND", message: "일치하는 회원이 없습니다." },
    });
    const user = userEvent.setup();
    render(<FindIdForm />);

    await user.type(screen.getByLabelText("이름"), "홍길동");
    await user.type(screen.getByLabelText("전화번호"), "010-1234-5678");
    await user.click(screen.getByRole("button", { name: /아이디 찾기/ }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("일치하는 회원이 없습니다.");
    });
  });

  it("필드 에러가 있는 실패 시 toast를 띄우지 않고 필드 에러를 보여준다", async () => {
    vi.mocked(findUserEmail).mockResolvedValue({
      success: false,
      error: {
        category: "VALIDATION",
        message: "입력 값을 확인해주세요.",
        fieldErrors: { name: ["이름은 2자 이상 입력해주세요."] },
      },
    });
    const user = userEvent.setup();
    render(<FindIdForm />);

    await user.type(screen.getByLabelText("이름"), "홍");
    await user.type(screen.getByLabelText("전화번호"), "010-1234-5678");
    await user.click(screen.getByRole("button", { name: /아이디 찾기/ }));

    expect(
      await screen.findByText("이름은 2자 이상 입력해주세요."),
    ).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
