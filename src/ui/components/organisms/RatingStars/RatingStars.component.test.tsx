import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { REVIEW_RATING_MAX } from "@/core/domain/review";
import { RatingStars } from "./RatingStars";

describe("RatingStars", () => {
  it("onChange가 없으면 읽기 전용으로 표시한다", () => {
    const { container } = render(<RatingStars value={3} />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(
      container.querySelector('[aria-label="평점 3점"]'),
    ).toBeInTheDocument();
  });

  it("onChange가 있으면 별마다 클릭 가능한 버튼을 표시한다", () => {
    render(<RatingStars value={3} onChange={vi.fn()} />);

    expect(screen.getAllByRole("button")).toHaveLength(REVIEW_RATING_MAX);
  });

  it("별을 클릭하면 해당 값으로 onChange를 호출한다", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<RatingStars value={3} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "4점" }));

    expect(onChange).toHaveBeenCalledWith(4);
  });
});
