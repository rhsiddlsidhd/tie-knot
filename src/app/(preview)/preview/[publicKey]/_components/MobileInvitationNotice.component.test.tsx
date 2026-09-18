import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MobileInvitationNotice } from "./MobileInvitationNotice";

describe("MobileInvitationNotice", () => {
  it("title을 제목으로 표시한다", () => {
    render(
      <MobileInvitationNotice
        title="준비 중인 청첩장입니다"
        description="곧 소중한 소식을 전해드릴게요."
      />,
    );

    expect(
      screen.getByRole("heading", { name: "준비 중인 청첩장입니다" }),
    ).toBeInTheDocument();
  });

  it("description을 함께 표시한다", () => {
    render(
      <MobileInvitationNotice
        title="종료된 청첩장입니다"
        description="tie-knot에서 새로운 시작을 위한 모바일 청첩장을 만나보세요."
      />,
    );

    expect(
      screen.getByText(
        "tie-knot에서 새로운 시작을 위한 모바일 청첩장을 만나보세요.",
      ),
    ).toBeInTheDocument();
  });
});
