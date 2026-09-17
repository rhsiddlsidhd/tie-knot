import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SheetPanel } from "./SheetPanel";

describe("SheetPanel", () => {
  it("trigger 클릭 시 Sheet가 열리고 title과 children이 렌더된다", async () => {
    const user = userEvent.setup();
    render(
      <SheetPanel
        title="테스트 패널"
        trigger={<button type="button">열기</button>}
      >
        {(close) => (
          <div>
            <p>본문 콘텐츠</p>
            <button type="button" onClick={close}>
              콘텐츠 닫기
            </button>
          </div>
        )}
      </SheetPanel>,
    );

    await user.click(screen.getByRole("button", { name: "열기" }));

    expect(
      screen.getByRole("heading", { name: "테스트 패널" }),
    ).toBeInTheDocument();
    expect(screen.getByText("본문 콘텐츠")).toBeInTheDocument();
  });

  it("셸의 커스텀 닫기 버튼 클릭 시 패널이 닫힌다", async () => {
    const user = userEvent.setup();
    render(
      <SheetPanel
        title="테스트 패널"
        trigger={<button type="button">열기</button>}
      >
        {() => <p>본문 콘텐츠</p>}
      </SheetPanel>,
    );

    await user.click(screen.getByRole("button", { name: "열기" }));
    expect(screen.getByText("본문 콘텐츠")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "메뉴 닫기" }));

    expect(screen.queryByText("본문 콘텐츠")).not.toBeInTheDocument();
  });

  it("children에 전달된 close 콜백 호출 시 패널이 닫힌다", async () => {
    const user = userEvent.setup();
    render(
      <SheetPanel
        title="테스트 패널"
        trigger={<button type="button">열기</button>}
      >
        {(close) => (
          <div>
            <p>본문 콘텐츠</p>
            <button type="button" onClick={close}>
              콘텐츠 닫기
            </button>
          </div>
        )}
      </SheetPanel>,
    );

    await user.click(screen.getByRole("button", { name: "열기" }));
    expect(screen.getByText("본문 콘텐츠")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "콘텐츠 닫기" }));

    expect(screen.queryByText("본문 콘텐츠")).not.toBeInTheDocument();
  });

  it("로고가 홈으로 이동하는 링크로 렌더된다", async () => {
    const user = userEvent.setup();
    render(
      <SheetPanel
        title="테스트 패널"
        trigger={<button type="button">열기</button>}
      >
        {() => <p>본문 콘텐츠</p>}
      </SheetPanel>,
    );

    await user.click(screen.getByRole("button", { name: "열기" }));

    expect(screen.getByRole("link", { name: "Tie Knot" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
