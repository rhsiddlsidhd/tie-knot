import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ChangePasswordForm } from "./ChangePasswordForm";

describe("ChangePasswordForm", () => {
  it("기본 상태에서는 비밀번호 입력란을 숨긴다", () => {
    render(<ChangePasswordForm />);

    expect(screen.getByText("비밀번호 변경")).toBeInTheDocument();
    expect(screen.queryByLabelText("현재 비밀번호")).not.toBeInTheDocument();
  });

  it("변경하기를 누르면 현재·새·확인 비밀번호 입력란을 표시한다", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.click(screen.getByRole("button", { name: "변경하기" }));

    expect(screen.getByLabelText("현재 비밀번호")).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByLabelText("새 비밀번호")).toBeInTheDocument();
    expect(screen.getByLabelText("새 비밀번호 확인")).toBeInTheDocument();
  });

  it("닫기를 누르면 비밀번호 입력란을 다시 숨긴다", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.click(screen.getByRole("button", { name: "변경하기" }));
    await user.click(screen.getByRole("button", { name: "닫기" }));

    expect(screen.queryByLabelText("현재 비밀번호")).not.toBeInTheDocument();
  });
});
