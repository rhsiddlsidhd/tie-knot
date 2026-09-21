import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ImageField는 CloudinaryWidget 어댑터를 사용한다 — 외부 Cloudinary SDK 경계만
// Mock으로 대체하고, 이 테스트는 ImagesSection이 thumbnail/gallery props를
// 각 ImageField에 올바르게 전달하는지만 검증한다.
vi.mock("@/adapters/browser/cloudinary/widget", () => ({
  CloudinaryWidget: ({
    onUpload,
    children,
  }: {
    onUpload: (url: string) => void;
    children: (controls: {
      isLoading: boolean;
      open: () => void;
    }) => React.ReactNode;
  }) =>
    children({
      isLoading: false,
      open: () =>
        onUpload("https://res.cloudinary.com/demo/image/upload/new.jpg"),
    }),
}));

import { ImagesSection } from "./ImagesSection";

const buildItem = (id: string) => ({
  id,
  preview: `https://example.com/${id}.jpg`,
  url: `https://example.com/${id}.jpg`,
});

const buildImageList = (items: ReturnType<typeof buildItem>[] = []) => ({
  items,
  add: vi.fn(),
  remove: vi.fn(),
  getUrls: vi.fn(() => items.map((item) => item.url)),
  reset: vi.fn(),
});

describe("ImagesSection", () => {
  it("메인 이미지와 갤러리 섹션을 렌더링한다", () => {
    render(
      <ImagesSection thumbnail={buildImageList()} gallery={buildImageList()} />,
    );

    expect(screen.getByText("메인 이미지")).toBeInTheDocument();
    expect(screen.getByText("갤러리")).toBeInTheDocument();
  });

  it("메인 이미지 업로드 버튼을 클릭하면 thumbnail.add가 호출되고 gallery.add는 호출되지 않는다", async () => {
    const user = userEvent.setup();
    const thumbnail = buildImageList();
    const gallery = buildImageList();
    render(<ImagesSection thumbnail={thumbnail} gallery={gallery} />);

    const [thumbnailUploadButton] = screen.getAllByRole("button", {
      name: /클릭하여 이미지 업로드/,
    });
    await user.click(thumbnailUploadButton);

    expect(thumbnail.add).toHaveBeenCalledWith([
      "https://res.cloudinary.com/demo/image/upload/new.jpg",
    ]);
    expect(gallery.add).not.toHaveBeenCalled();
  });

  it("메인 이미지가 3장이면(maxCount 도달) 추가 버튼을 숨긴다", () => {
    const thumbnail = buildImageList([
      buildItem("t1"),
      buildItem("t2"),
      buildItem("t3"),
    ]);
    render(<ImagesSection thumbnail={thumbnail} gallery={buildImageList()} />);

    expect(
      screen.queryByRole("button", { name: "이미지 추가" }),
    ).not.toBeInTheDocument();
  });

  it("메인 이미지가 3장 미만이면 추가 버튼을 보여준다", () => {
    const thumbnail = buildImageList([buildItem("t1"), buildItem("t2")]);
    render(<ImagesSection thumbnail={thumbnail} gallery={buildImageList()} />);

    expect(
      screen.getByRole("button", { name: "이미지 추가" }),
    ).toBeInTheDocument();
  });

  it("삭제 버튼을 클릭하면 해당 항목 id로 thumbnail.remove를 호출한다", async () => {
    const user = userEvent.setup();
    const thumbnail = buildImageList([buildItem("thumb-only")]);
    render(<ImagesSection thumbnail={thumbnail} gallery={buildImageList()} />);

    const [removeButton] = screen.getAllByRole("button");
    await user.click(removeButton);

    expect(thumbnail.remove).toHaveBeenCalledWith("thumb-only");
  });
});
