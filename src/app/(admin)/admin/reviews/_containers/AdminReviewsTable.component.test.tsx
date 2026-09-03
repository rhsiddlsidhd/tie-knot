import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AdminReviewListPage } from "@/core/domain/review";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
  usePathname: () => "/admin/reviews",
}));

const deleteReviewByAdmin = vi.fn();
vi.mock("@/actions/deleteReviewByAdmin", () => ({
  deleteReviewByAdmin: (...args: unknown[]) => deleteReviewByAdmin(...args),
}));

import { AdminReviewsTable } from "./AdminReviewsTable";

const buildPage = (
  overrides?: Partial<AdminReviewListPage>,
): AdminReviewListPage => ({
  items: [
    {
      id: "review-1",
      productTitle: "봄빛 청첩장 세트",
      authorName: "김민준",
      rating: 5,
      content: "아주 만족스러운 상품이었어요.",
      createdAt: new Date("2026-08-19T15:30:00.000Z"), // KST 2026-08-20
    },
  ],
  nextCursor: null,
  ...overrides,
});

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe("AdminReviewsTable", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    deleteReviewByAdmin.mockClear();
  });

  it("리뷰 행을 실제 props 기준으로 렌더링하고 작성일을 KST로 표시한다", () => {
    render(<AdminReviewsTable page={buildPage()} />);

    expect(screen.getByText("봄빛 청첩장 세트")).toBeInTheDocument();
    expect(screen.getByText("김민준")).toBeInTheDocument();
    expect(
      screen.getByText("아주 만족스러운 상품이었어요."),
    ).toBeInTheDocument();
    expect(screen.getByText("2026.8.20")).toBeInTheDocument();
  });

  it("항목이 없으면 빈 상태 UI를 보여준다", () => {
    render(<AdminReviewsTable page={buildPage({ items: [] })} />);

    expect(screen.getByText("등록된 리뷰가 없습니다")).toBeInTheDocument();
  });

  it("삭제 확인창은 대상 리뷰와 복구 불가를 알리고, 확인하면 삭제 후 새로고침한다", async () => {
    deleteReviewByAdmin.mockResolvedValue({
      success: true,
      data: { message: "리뷰가 삭제되었습니다." },
    });
    const user = userEvent.setup();
    render(<AdminReviewsTable page={buildPage()} />);

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
    render(<AdminReviewsTable page={buildPage()} />);

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
    render(<AdminReviewsTable page={buildPage()} />);

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
    render(<AdminReviewsTable page={buildPage()} />);

    await user.click(screen.getByRole("button", { name: "삭제" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "삭제" }));
    await user.click(within(dialog).getByRole("button", { name: "삭제 중..." }));

    expect(deleteReviewByAdmin).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve({ success: true, data: { message: "삭제되었습니다." } });
    });
  });

  it("nextCursor가 없으면 다음 페이지 버튼이 비활성화된다", () => {
    render(<AdminReviewsTable page={buildPage({ nextCursor: null })} />);

    expect(screen.getByRole("button", { name: "다음 페이지" })).toBeDisabled();
  });
});
