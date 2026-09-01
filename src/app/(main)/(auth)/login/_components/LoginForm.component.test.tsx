import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("제출 시 action이 호출된다", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm action={action} pending={false} />);

    await user.type(screen.getByLabelText("이메일"), "a@b.com");
    await user.type(screen.getByLabelText("비밀번호"), "password1234");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(action).toHaveBeenCalled();
  });

  it("비밀번호 찾기/회원가입/아이디 찾기 링크를 보여준다", () => {
    render(<LoginForm action={vi.fn()} pending={false} />);

    expect(screen.getByRole("link", { name: "비밀번호 찾기" })).toHaveAttribute("href", "/find-password");
    expect(screen.getByRole("link", { name: "회원가입" })).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: "아이디 찾기" })).toHaveAttribute("href", "/find-id");
  });

  it("Google 버튼은 준비 중 상태로 비활성화되고 안내 문구를 보여준다", () => {
    render(<LoginForm action={vi.fn()} pending={false} />);

    expect(screen.getByRole("button", { name: /Google/ })).toBeDisabled();
    expect(screen.getByText("소셜 계정 연동은 준비 중입니다. 이메일 계정을 이용해 주세요.")).toBeInTheDocument();
  });
});
