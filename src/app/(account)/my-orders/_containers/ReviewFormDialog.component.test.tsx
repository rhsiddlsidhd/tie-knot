import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const actions = vi.hoisted(() => ({
  createReview: vi.fn(),
  updateReview: vi.fn(),
  deleteReview: vi.fn(),
}));
const refresh = vi.hoisted(() => vi.fn());

vi.mock("@/actions/createReview", () => ({
  createReview: actions.createReview,
}));
vi.mock("@/actions/updateReview", () => ({
  updateReview: actions.updateReview,
}));
vi.mock("@/actions/deleteReview", () => ({
  deleteReview: actions.deleteReview,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/adapters/browser/cloudinary/widget", () => ({
  CloudinaryWidget: ({
    children,
  }: {
    children: (controls: { isLoading: boolean; open: () => void }) => React.ReactNode;
  }) => children({ isLoading: false, open: vi.fn() }),
}));

import type { OrderReviewSummary } from "@/core/domain/order";
import { ReviewFormDialog } from "./ReviewFormDialog";

const successResponse = { success: true as const, data: { message: "완료되었습니다." } };

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const existingReview: OrderReviewSummary = {
  id: "review-1",
  rating: 4,
  content: "만족스러운 상품이었습니다.",
  images: [],
};

// 리뷰 Dialog 안에서 삭제 확인 AlertDialog를 여는 지점까지 진행한다.
const openDeleteConfirm = async () => {
  const user = userEvent.setup();
  render(<ReviewFormDialog orderId="order-1" review={existingReview} />);

  await user.click(screen.getByRole("button", { name: "리뷰 보기·수정" }));
  await user.click(screen.getByRole("button", { name: "리뷰 삭제" }));

  return user;
};

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

  it("삭제 확인을 취소하면 확인창만 닫히고 리뷰 다이얼로그와 포커스가 남는다", async () => {
    const user = await openDeleteConfirm();

    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "취소",
      }),
    );

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("heading", { name: "리뷰 수정" })).toBeInTheDocument();
    expect(actions.deleteReview).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "리뷰 삭제" })).toHaveFocus();
  });

  it("삭제를 확인해 성공하면 확인창과 리뷰 다이얼로그가 함께 닫힌다", async () => {
    actions.deleteReview.mockResolvedValue(successResponse);
    const user = await openDeleteConfirm();

    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "삭제",
      }),
    );

    expect(actions.deleteReview).toHaveBeenCalledWith("review-1");
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.queryByRole("heading", { name: "리뷰 수정" })).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("삭제에 실패하면 확인창과 리뷰 다이얼로그가 모두 남는다", async () => {
    actions.deleteReview.mockResolvedValue({
      success: false,
      error: { category: "INTERNAL", message: "삭제에 실패했습니다." },
    });
    const user = await openDeleteConfirm();

    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "삭제",
      }),
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    // 확인창이 떠 있는 동안 바깥 Dialog는 aria-hidden으로 가려지지만 그대로 남는다.
    expect(
      screen.getByRole("heading", { name: "리뷰 수정", hidden: true }),
    ).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("삭제가 진행되는 동안 확인 버튼을 다시 눌러도 deleteReview를 중복 호출하지 않는다", async () => {
    const deferred = createDeferred<typeof successResponse>();
    actions.deleteReview.mockReturnValue(deferred.promise);
    const user = await openDeleteConfirm();

    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "삭제" }));
    await user.click(within(dialog).getByRole("button", { name: "삭제 중..." }));

    expect(actions.deleteReview).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve(successResponse);
    });
  });
});
