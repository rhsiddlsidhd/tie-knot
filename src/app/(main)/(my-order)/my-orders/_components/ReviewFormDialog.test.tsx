import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const actions = vi.hoisted(() => ({
  createReview: vi.fn(),
  updateReview: vi.fn(),
  deleteReview: vi.fn(),
}));
const refresh = vi.hoisted(() => vi.fn());

vi.mock("@/actions", () => actions);
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/adapters/browser/cloudinary", () => ({
  CloudinaryWidget: ({
    children,
  }: {
    children: (controls: { isLoading: boolean; open: () => void }) => React.ReactNode;
  }) => children({ isLoading: false, open: vi.fn() }),
}));

import type { OrderReviewSummary } from "@/core/domain";
import { ReviewFormDialog } from "./ReviewFormDialog";

const successResponse = { success: true as const, data: { message: "완료되었습니다." } };

describe("ReviewFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("작성 모드에서는 '리뷰 작성' 버튼을 보여주고, 평점 선택 전엔 제출을 막는다", async () => {
    const user = userEvent.setup();
    render(<ReviewFormDialog orderId="order-1" review={null} />);

    await user.click(screen.getByRole("button", { name: "리뷰 작성" }));

    expect(screen.getByRole("heading", { name: "리뷰 작성" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "등록하기" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "리뷰 삭제" })).toBeNull();
  });

  it("평점을 선택하고 제출하면 createReview에 orderId와 함께 위임한다", async () => {
    actions.createReview.mockResolvedValue(successResponse);
    const user = userEvent.setup();
    render(<ReviewFormDialog orderId="order-1" review={null} />);

    await user.click(screen.getByRole("button", { name: "리뷰 작성" }));
    await user.click(screen.getByRole("button", { name: "5점" }));
    await user.type(
      screen.getByLabelText("리뷰 내용"),
      "만족스러운 상품이었습니다.",
    );
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(actions.createReview).toHaveBeenCalledTimes(1);
    const [, formData] = actions.createReview.mock.calls[0];
    expect(formData.get("orderId")).toBe("order-1");
    expect(formData.get("rating")).toBe("5");
    expect(formData.get("content")).toBe("만족스러운 상품이었습니다.");
  });

  it("수정 모드에서는 기존 값으로 채워지고 삭제 버튼이 노출된다", async () => {
    const review: OrderReviewSummary = {
      id: "review-1",
      rating: 4,
      content: "만족스러운 상품이었습니다.",
      images: [],
    };
    const user = userEvent.setup();
    render(<ReviewFormDialog orderId="order-1" review={review} />);

    await user.click(screen.getByRole("button", { name: "리뷰 보기·수정" }));

    expect(
      screen.getByDisplayValue("만족스러운 상품이었습니다."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "리뷰 삭제" })).toBeInTheDocument();
  });

  it("삭제 확인 후 deleteReview에 reviewId를 위임한다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    actions.deleteReview.mockResolvedValue(successResponse);
    const review: OrderReviewSummary = {
      id: "review-1",
      rating: 4,
      content: "만족스러운 상품이었습니다.",
      images: [],
    };
    const user = userEvent.setup();
    render(<ReviewFormDialog orderId="order-1" review={review} />);

    await user.click(screen.getByRole("button", { name: "리뷰 보기·수정" }));
    await user.click(screen.getByRole("button", { name: "리뷰 삭제" }));

    expect(actions.deleteReview).toHaveBeenCalledWith("review-1");
  });
});
