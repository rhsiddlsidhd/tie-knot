import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const deleteReviewByAdmin = vi.fn();
vi.mock("@/actions/deleteReviewByAdmin", () => ({
  deleteReviewByAdmin: (...args: unknown[]) => deleteReviewByAdmin(...args),
}));

import { ReviewDeleteButton } from "./ReviewDeleteButton";

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe("ReviewDeleteButton", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    deleteReviewByAdmin.mockClear();
  });

  it("삭제 확인창은 대상 리뷰와 복구 불가를 알리고, 확인하면 삭제 후 새로고침한다", async () => {
    deleteReviewByAdmin.mockResolvedValue({
      success: true,
      data: { message: "리뷰가 삭제되었습니다." },
    });
    const user = userEvent.setup();
    render(
      <ReviewDeleteButton
        reviewId="review-1"
        authorName="김민준"
        productTitle="봄빛 청첩장 세트"
      />,
    );

    await user.click(screen.getByRole("button", { name: "삭제" }));

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("김민준");
    expect(dialog).toHaveTextContent("봄빛 청첩장 세트");
    expect(dialog).toHaveTextContent("복구할 수 없습니다");

    await user.click(within(dialog).getByRole("button", { name: "삭제" }));

    expect(deleteReviewByAdmin).toHaveBeenCalledWith("review-1");
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("삭제를 취소하면 deleteReviewByAdmin을 호출하지 않는다", async () => {
    const user = userEvent.setup();
    render(
      <ReviewDeleteButton
        reviewId="review-1"
        authorName="김민준"
        productTitle="봄빛 청첩장 세트"
      />,
    );

    await user.click(screen.getByRole("button", { name: "삭제" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "취소",
      }),
    );

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(deleteReviewByAdmin).not.toHaveBeenCalled();
  });

  it("삭제에 실패하면 확인창을 열어둔 채 재시도할 수 있다", async () => {
    deleteReviewByAdmin.mockResolvedValue({
      success: false,
      error: { category: "INTERNAL", message: "삭제에 실패했습니다." },
    });
    const user = userEvent.setup();
    render(
      <ReviewDeleteButton
        reviewId="review-1"
        authorName="김민준"
        productTitle="봄빛 청첩장 세트"
      />,
    );

    await user.click(screen.getByRole("button", { name: "삭제" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "삭제",
      }),
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("삭제가 진행되는 동안 확인 버튼을 다시 눌러도 중복 호출하지 않는다", async () => {
    const deferred = createDeferred<{ success: true; data: { message: string } }>();
    deleteReviewByAdmin.mockReturnValue(deferred.promise);
    const user = userEvent.setup();
    render(
      <ReviewDeleteButton
        reviewId="review-1"
        authorName="김민준"
        productTitle="봄빛 청첩장 세트"
      />,
    );

    await user.click(screen.getByRole("button", { name: "삭제" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "삭제" }));
    await user.click(within(dialog).getByRole("button", { name: "삭제 중..." }));

    expect(deleteReviewByAdmin).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve({ success: true, data: { message: "삭제되었습니다." } });
    });
  });
});
