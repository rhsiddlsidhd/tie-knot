import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomActionBar } from "./BottomActionBar";

describe("BottomActionBar", () => {
  it("children을 제출 버튼에 표시한다", () => {
    render(<BottomActionBar>저장하기</BottomActionBar>);

    const button = screen.getByRole("button", { name: "저장하기" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("disabled가 true면 버튼을 비활성화한다", () => {
    render(<BottomActionBar disabled>저장하기</BottomActionBar>);

    expect(screen.getByRole("button", { name: "저장하기" })).toBeDisabled();
  });

  it("disabled를 지정하지 않으면 버튼이 활성화돼 있다", () => {
    render(<BottomActionBar>저장하기</BottomActionBar>);

    expect(screen.getByRole("button", { name: "저장하기" })).toBeEnabled();
  });
});
