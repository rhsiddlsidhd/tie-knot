import { useRef, type ComponentProps, type RefObject } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GuestbookList } from "./GuestbookList";
import type { GuestbookEntryProps } from "../_utils/guestbookSection.mapper";

type GuestbookListProps = ComponentProps<typeof GuestbookList>;
type RefFreeProps = Omit<
  GuestbookListProps,
  "scrollContainerRef" | "sentinelRef"
>;

// scrollContainerRef/sentinelRef는 RefObject라 실제 useRef로 감싼 wrapper 없이는
// hasMore=true일 때 sentinel 엘리먼트가 실제로 마운트되는지 관찰할 수 없다.
const renderGuestbookList = (props: RefFreeProps) => {
  let scrollContainerRef!: RefObject<HTMLDivElement | null>;
  let sentinelRef!: RefObject<HTMLDivElement | null>;

  const Wrapper = () => {
    scrollContainerRef = useRef<HTMLDivElement>(null);
    sentinelRef = useRef<HTMLDivElement>(null);
    return (
      <GuestbookList
        {...props}
        scrollContainerRef={scrollContainerRef}
        sentinelRef={sentinelRef}
      />
    );
  };

  const utils = render(<Wrapper />);
  return {
    ...utils,
    getSentinelRef: () => sentinelRef,
    getScrollContainerRef: () => scrollContainerRef,
  };
};

const items: GuestbookEntryProps[] = [
  { id: "1", author: "작성자1", message: "메시지1" },
  { id: "2", author: "작성자2", message: "메시지2" },
];

describe("GuestbookList", () => {
  it("status가 loading이면 로딩 문구를 보여준다", () => {
    renderGuestbookList({
      status: "loading",
      items: [],
      hasMore: false,
      onDeleteClick: vi.fn(),
    });

    expect(screen.getByText("방명록을 불러오는 중입니다.")).toBeInTheDocument();
  });

  it("status가 ready이고 목록이 비어있으면 빈 상태 문구를 보여준다", () => {
    renderGuestbookList({
      status: "ready",
      items: [],
      hasMore: false,
      onDeleteClick: vi.fn(),
    });

    expect(screen.getByText("등록된 방명록이 없습니다.")).toBeInTheDocument();
  });

  it("항목을 작성자/메시지와 함께 렌더링한다", () => {
    renderGuestbookList({
      status: "ready",
      items,
      hasMore: false,
      onDeleteClick: vi.fn(),
    });

    expect(screen.getByText("작성자1")).toBeInTheDocument();
    expect(screen.getByText("메시지1")).toBeInTheDocument();
    expect(screen.getByText("작성자2")).toBeInTheDocument();
    expect(screen.getByText("메시지2")).toBeInTheDocument();
  });

  it("삭제 버튼을 클릭하면 해당 항목의 id로 onDeleteClick을 호출한다", async () => {
    const user = userEvent.setup();
    const onDeleteClick = vi.fn();
    renderGuestbookList({
      status: "ready",
      items,
      hasMore: false,
      onDeleteClick,
    });

    const [firstDeleteButton] = screen.getAllByRole("button");
    await user.click(firstDeleteButton);

    expect(onDeleteClick).toHaveBeenCalledWith("1");
  });

  it("hasMore가 true면 무한스크롤 sentinel을 마운트한다", () => {
    const { getSentinelRef } = renderGuestbookList({
      status: "ready",
      items,
      hasMore: true,
      onDeleteClick: vi.fn(),
    });

    expect(getSentinelRef().current).not.toBeNull();
  });

  it("hasMore가 false면 sentinel을 마운트하지 않는다", () => {
    const { getSentinelRef } = renderGuestbookList({
      status: "ready",
      items,
      hasMore: false,
      onDeleteClick: vi.fn(),
    });

    expect(getSentinelRef().current).toBeNull();
  });
});
