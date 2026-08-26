import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageField } from "./ImageField";

vi.mock("@/adapters/browser/cloudinary", () => ({
  CloudinaryWidget: ({
    children,
    onUpload,
  }: {
    children: (controls: {
      isLoading: boolean;
      open: () => void;
    }) => React.ReactNode;
    onUpload: (url: string) => void;
  }) =>
    children({
      isLoading: false,
      open: () =>
        onUpload("https://res.cloudinary.com/demo/image/upload/new.jpg"),
    }),
}));

const buildItem = (id: string) => ({
  id,
  preview: `https://example.com/${id}.jpg`,
  url: `https://example.com/${id}.jpg`,
});

const renderField = (
  props: Partial<React.ComponentProps<typeof ImageField>> = {},
) =>
  render(
    <ImageField
      id="thumb"
      folder="products/thumbnails"
      items={[]}
      onAdd={vi.fn()}
      onRemove={vi.fn()}
      {...props}
    />,
  );

describe("ImageField", () => {
  it("항목이 없으면 위젯 업로드 버튼을 보여준다", () => {
    renderField();
    expect(
      screen.getByRole("button", { name: /클릭하여 이미지 업로드/ }),
    ).toBeInTheDocument();
  });

  it("위젯 업로드가 성공하면 URL을 onAdd에 전달한다", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderField({ onAdd });
    await user.click(
      screen.getByRole("button", { name: /클릭하여 이미지 업로드/ }),
    );
    expect(onAdd).toHaveBeenCalledWith([
      "https://res.cloudinary.com/demo/image/upload/new.jpg",
    ]);
  });

  it("항목이 있으면 미리보기와 추가 버튼을 보여준다", () => {
    renderField({ items: [buildItem("1")] });
    expect(screen.getByAltText("Preview 1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "이미지 추가" }),
    ).toBeInTheDocument();
  });

  it("maxCount에 도달하면 추가 버튼을 숨긴다", () => {
    renderField({ items: [buildItem("1")], maxCount: 1 });
    expect(
      screen.queryByRole("button", { name: "이미지 추가" }),
    ).not.toBeInTheDocument();
  });

  it("삭제 버튼 클릭 시 onRemove를 해당 id로 호출한다", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderField({ items: [buildItem("target")], onRemove, maxCount: 1 });
    await user.click(screen.getByRole("button"));
    expect(onRemove).toHaveBeenCalledWith("target");
  });
});
