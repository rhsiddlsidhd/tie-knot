import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { GuestbookListResponse } from "@/core/schemas/response/guestbook.schema";

// GuestbookSection.component.test.tsx가 이미 실제 useSWRInfinite + MSW +
// IntersectionObserver 결합으로 이 컨테이너를 통과시켜 첫 페이지 로드, 무한
// 스크롤 이어붙이기, 모달 close 시 전체 재검증을 검증한다(GuestbookSection이
// sample이 아닌 publicKey에서 바로 LiveGuestbookSection을 렌더하기 때문). 그
// 흐름을 여기서 다시 반복하지 않는다 — 이 파일은 그 테스트가 다루지 않는
// LiveGuestbookSection 고유의 결합 로직(SWR 데이터 → GuestbookList props 매핑,
// 작성/삭제 버튼 클릭 → guestbook 모달 store 호출)만 검증한다.
const { useSWRInfiniteMock } = vi.hoisted(() => ({
  useSWRInfiniteMock: vi.fn(),
}));

vi.mock("swr/infinite", () => ({
  default: useSWRInfiniteMock,
}));

const { setIsOpenMock } = vi.hoisted(() => ({
  setIsOpenMock: vi.fn(),
}));

vi.mock("@/ui/stores/use-app-store", () => ({
  useGuestbookModalStore: (
    selector: (state: {
      setIsOpen: typeof setIsOpenMock;
      isOpen: boolean;
      type: string | null;
    }) => unknown,
  ) => selector({ setIsOpen: setIsOpenMock, isOpen: false, type: null }),
}));

import { LiveGuestbookSection } from "./LiveGuestbookSection";

const PUBLIC_KEY = "public-key-1";

const page1: GuestbookListResponse = {
  items: [
    {
      _id: "entry-1",
      author: "김철수",
      message: "결혼 축하합니다",
      isPrivate: false,
      createdAt: "2026-08-01T00:00:00.000Z",
    },
  ],
  nextCursor: null,
};

const mockSwrInfinite = (data: GuestbookListResponse[] | undefined) => {
  useSWRInfiniteMock.mockReturnValue({
    data,
    size: 1,
    setSize: vi.fn(),
    isValidating: false,
    mutate: vi.fn(),
  });
}

describe("LiveGuestbookSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("첫 페이지 응답 전에는 로딩 상태를 GuestbookList에 전달한다", () => {
    mockSwrInfinite(undefined);

    render(<LiveGuestbookSection publicKey={PUBLIC_KEY} />);

    expect(screen.getByText("방명록을 불러오는 중입니다.")).toBeInTheDocument();
  });

  it("로드된 SWR 페이지를 방명록 항목으로 매핑해 렌더한다", () => {
    mockSwrInfinite([page1]);

    render(<LiveGuestbookSection publicKey={PUBLIC_KEY} />);

    expect(screen.getByText("김철수")).toBeInTheDocument();
    expect(screen.getByText("결혼 축하합니다")).toBeInTheDocument();
  });

  it("방명록 작성하기 버튼을 클릭하면 이 publicKey로 작성 모달을 연다", async () => {
    mockSwrInfinite([page1]);
    const user = userEvent.setup();
    render(<LiveGuestbookSection publicKey={PUBLIC_KEY} />);

    await user.click(screen.getByRole("button", { name: "방명록 작성하기" }));

    expect(setIsOpenMock).toHaveBeenCalledWith({
      isOpen: true,
      type: "WRITE_GUESTBOOK",
      payload: { publicKey: PUBLIC_KEY },
    });
  });

  it("항목의 삭제 버튼을 클릭하면 그 항목 id와 publicKey로 삭제 모달을 연다", async () => {
    mockSwrInfinite([page1]);
    const user = userEvent.setup();
    render(<LiveGuestbookSection publicKey={PUBLIC_KEY} />);

    const [deleteButton] = screen.getAllByRole("button");
    await user.click(deleteButton);

    expect(setIsOpenMock).toHaveBeenCalledWith({
      isOpen: true,
      type: "DELETE_GUESTBOOK",
      payload: { id: "entry-1", publicKey: PUBLIC_KEY },
    });
  });
});
