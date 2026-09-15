import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThumbnailSlide } from "./ThumbnailSlide";

vi.mock("@/adapters/browser/cloudinary/widget", () => ({
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
      open: () => onUpload("https://example.com/uploaded.png"),
    }),
}));

const buildItem = (url: string) => ({ id: "1", preview: url, url });

const renderSlide = (
  overrides: Partial<Parameters<typeof ThumbnailSlide>[0]> = {},
) => {
  const onAdd = vi.fn();
  const view = render(
    <ThumbnailSlide
      state={null}
      items={[]}
      isMobileInvitation
      onAdd={onAdd}
      onRemove={vi.fn()}
      onPrevious={vi.fn()}
      onNext={vi.fn()}
      {...overrides}
    />,
  );

  return { ...view, onAdd };
};

describe("ThumbnailSlide", () => {
  it("등록된 썸네일 URL을 hidden 필드로 전송한다", () => {
    const { container } = renderSlide({
      items: [buildItem("https://example.com/thumb.png")],
    });

    expect(container.querySelector("input[name='thumbnail']")).toHaveValue(
      "https://example.com/thumb.png",
    );
  });

  it("썸네일이 없으면 hidden 필드를 빈 값으로 둔다", () => {
    const { container } = renderSlide();

    expect(container.querySelector("input[name='thumbnail']")).toHaveValue("");
  });

  it("스텝 오류 메시지를 표시한다", () => {
    renderSlide({ stepError: "썸네일 이미지를 등록해주세요." });

    expect(
      screen.getByText("썸네일 이미지를 등록해주세요."),
    ).toBeInTheDocument();
  });

  it("모바일 청첩장이면 다음 단계를 미리보기 이미지로 안내한다", () => {
    renderSlide();

    expect(
      screen.getByRole("button", { name: "다음: 미리보기 이미지" }),
    ).toBeInTheDocument();
  });

  it("실물 상품이면 다음 단계를 상세 이미지로 안내한다", () => {
    renderSlide({ isMobileInvitation: false });

    expect(
      screen.getByRole("button", { name: "다음: 상세 이미지" }),
    ).toBeInTheDocument();
  });

  it("업로드가 끝나면 onAdd로 URL을 전달한다", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderSlide();

    await user.click(screen.getByRole("button", { name: /이미지 업로드/ }));

    expect(onAdd).toHaveBeenCalledWith(["https://example.com/uploaded.png"]);
  });
});
