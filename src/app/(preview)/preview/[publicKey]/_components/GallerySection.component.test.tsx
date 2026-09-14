import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GallerySection } from "./GallerySection";

describe("GallerySection", () => {
  it("이미지가 없으면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<GallerySection images={[]} lightboxEnabled={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("이미지 목록을 썸네일 그리드로 렌더링한다", () => {
    render(
      <GallerySection images={["/gallery-1.jpg", "/gallery-2.jpg"]} lightboxEnabled={false} />,
    );

    expect(screen.getByAltText("Gallery image 1")).toBeInTheDocument();
    expect(screen.getByAltText("Gallery image 2")).toBeInTheDocument();
  });

  it("lightboxEnabled가 false면 썸네일을 클릭해도 라이트박스가 열리지 않는다", async () => {
    const user = userEvent.setup();
    render(<GallerySection images={["/gallery-1.jpg"]} lightboxEnabled={false} />);

    await user.click(screen.getByAltText("Gallery image 1").closest("button")!);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lightboxEnabled가 true면 클릭한 이미지로 라이트박스를 연다", async () => {
    const user = userEvent.setup();
    render(
      <GallerySection
        images={["/gallery-1.jpg", "/gallery-2.jpg", "/gallery-3.jpg"]}
        lightboxEnabled={true}
      />,
    );

    await user.click(screen.getByAltText("Gallery image 2").closest("button")!);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("2 / 3")).toBeInTheDocument();
  });

  it("라이트박스에서 다음/이전 버튼으로 이미지를 전환한다", async () => {
    const user = userEvent.setup();
    render(
      <GallerySection
        images={["/gallery-1.jpg", "/gallery-2.jpg", "/gallery-3.jpg"]}
        lightboxEnabled={true}
      />,
    );

    await user.click(screen.getByAltText("Gallery image 1").closest("button")!);
    const dialog = screen.getByRole("dialog");
    // 이전/다음 버튼은 아이콘만 있고 접근성 이름이 없다 — DialogContent 안에서
    // 실제 children 순서(이전 → 다음 → 커스텀 닫기 → Radix 기본 닫기)로 구분한다.
    const [prevButton, nextButton] = within(dialog).getAllByRole("button");

    await user.click(nextButton);
    expect(within(dialog).getByText("2 / 3")).toBeInTheDocument();

    await user.click(prevButton);
    expect(within(dialog).getByText("1 / 3")).toBeInTheDocument();
  });

  it("라이트박스에서 닫기 버튼을 클릭하면 라이트박스가 닫힌다", async () => {
    const user = userEvent.setup();
    render(<GallerySection images={["/gallery-1.jpg"]} lightboxEnabled={true} />);

    await user.click(screen.getByAltText("Gallery image 1").closest("button")!);
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
