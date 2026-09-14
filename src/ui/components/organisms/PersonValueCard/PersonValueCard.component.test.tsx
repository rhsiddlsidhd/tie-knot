import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PersonValueCard } from "./PersonValueCard";

describe("PersonValueCard", () => {
  it("relation, name, value를 표시한다", () => {
    render(
      <PersonValueCard
        relation="배우자"
        name="홍길동"
        value="123-456-789012"
        isCopied={false}
        onCopy={vi.fn()}
      />,
    );

    expect(screen.getByText("배우자")).toBeInTheDocument();
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("123-456-789012")).toBeInTheDocument();
  });

  it("subLabel이 있으면 함께 표시한다", () => {
    render(
      <PersonValueCard
        relation="배우자"
        name="홍길동"
        subLabel="국민은행"
        value="123-456-789012"
        isCopied={false}
        onCopy={vi.fn()}
      />,
    );

    expect(screen.getByText("국민은행")).toBeInTheDocument();
  });

  it("복사 버튼을 클릭하면 onCopy를 호출한다", async () => {
    const onCopy = vi.fn();
    const user = userEvent.setup();
    render(
      <PersonValueCard
        relation="배우자"
        name="홍길동"
        value="123-456-789012"
        isCopied={false}
        onCopy={onCopy}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));

    expect(onCopy).toHaveBeenCalledTimes(1);
  });
});
