import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TermsAgreementCard } from "./TermsAgreementCard";

describe("TermsAgreementCard", () => {
  it("agreed가 false면 체크박스가 선택되지 않은 상태로 렌더링된다", () => {
    render(<TermsAgreementCard agreed={false} onAgreedChange={vi.fn()} />);

    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("agreed가 true면 체크박스가 선택된 상태로 렌더링된다", () => {
    render(<TermsAgreementCard agreed={true} onAgreedChange={vi.fn()} />);

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("체크박스를 클릭하면 onAgreedChange를 true 인자로 호출한다", async () => {
    const onAgreedChange = vi.fn();
    const user = userEvent.setup();
    render(<TermsAgreementCard agreed={false} onAgreedChange={onAgreedChange} />);

    await user.click(screen.getByRole("checkbox"));

    expect(onAgreedChange).toHaveBeenCalledWith(true);
  });

  it("이미 동의한 상태에서 클릭하면 onAgreedChange를 false 인자로 호출한다", async () => {
    const onAgreedChange = vi.fn();
    const user = userEvent.setup();
    render(<TermsAgreementCard agreed={true} onAgreedChange={onAgreedChange} />);

    await user.click(screen.getByRole("checkbox"));

    expect(onAgreedChange).toHaveBeenCalledWith(false);
  });
});
