import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClipboardButton } from "./ClipboardButton";

describe("ClipboardButton", () => {
  it("isCopied 여부와 무관하게 'Copy to clipboard' 접근성 라벨을 유지한다", () => {
    const { rerender } = render(<ClipboardButton isCopied={false} onCopy={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeInTheDocument();

    rerender(<ClipboardButton isCopied={true} onCopy={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeInTheDocument();
  });

  it("클릭하면 onCopy를 호출한다", async () => {
    const onCopy = vi.fn();
    const user = userEvent.setup();
    render(<ClipboardButton isCopied={false} onCopy={onCopy} />);

    await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));

    expect(onCopy).toHaveBeenCalledTimes(1);
  });
});
