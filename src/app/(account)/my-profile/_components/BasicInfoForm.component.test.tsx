import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BasicInfoForm } from "./BasicInfoForm";

const renderForm = () =>
  render(
    <BasicInfoForm
      email="bride@example.com"
      name="김신부"
      phone="010-1234-5678"
    />,
  );

describe("BasicInfoForm", () => {
  it("전달받은 기본 정보를 입력값으로 표시한다", () => {
    renderForm();

    expect(screen.getByLabelText("이메일")).toHaveValue("bride@example.com");
    expect(screen.getByLabelText("이름")).toHaveValue("김신부");
    expect(screen.getByLabelText("전화번호")).toHaveValue("010-1234-5678");
  });

  it("기본 상태에서는 이름과 전화번호를 읽기 전용으로 잠근다", () => {
    renderForm();

    expect(screen.getByLabelText("이름")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("전화번호")).toHaveAttribute("readonly");
    expect(screen.queryByLabelText("비밀번호")).not.toBeInTheDocument();
  });

  it("변경하기를 누르면 이름과 전화번호를 수정할 수 있고 비밀번호 확인란을 추가한다", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "변경하기" }));

    expect(screen.getByLabelText("이름")).not.toHaveAttribute("readonly");
    expect(screen.getByLabelText("전화번호")).not.toHaveAttribute("readonly");
    expect(screen.getByLabelText("비밀번호")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "닫기" })).toBeInTheDocument();
  });

  it("이메일은 변경 상태에서도 읽기 전용으로 유지한다", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "변경하기" }));

    expect(screen.getByLabelText("이메일")).toHaveAttribute("readonly");
  });

  it("닫기를 누르면 읽기 전용 상태로 되돌린다", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "변경하기" }));
    await user.click(screen.getByRole("button", { name: "닫기" }));

    expect(screen.getByLabelText("이름")).toHaveAttribute("readonly");
    expect(screen.queryByLabelText("비밀번호")).not.toBeInTheDocument();
  });
});
