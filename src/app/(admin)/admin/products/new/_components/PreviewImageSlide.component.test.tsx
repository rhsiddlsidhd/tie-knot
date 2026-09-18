import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PreviewImageSlide } from "./PreviewImageSlide";

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

const renderSlide = (
  overrides: Partial<Parameters<typeof PreviewImageSlide>[0]> = {},
) =>
  render(
    <PreviewImageSlide
      items={[]}
      onAdd={vi.fn()}
      onRemove={vi.fn()}
      onPrevious={vi.fn()}
      onNext={vi.fn()}
      {...overrides}
    />,
  );

describe("PreviewImageSlide", () => {
  it("등록된 미리보기 URL을 hidden 필드로 전송한다", () => {
    const { container } = renderSlide({
      items: [
        {
          id: "1",
          preview: "https://example.com/preview.png",
          url: "https://example.com/preview.png",
        },
      ],
    });

    expect(container.querySelector("input[name='previewUrl']")).toHaveValue(
      "https://example.com/preview.png",
    );
  });

  it("미리보기가 없으면 hidden 필드를 빈 값으로 둔다", () => {
    const { container } = renderSlide();

    expect(container.querySelector("input[name='previewUrl']")).toHaveValue("");
  });

  it("선택 단계이므로 필수 표시를 하지 않는다", () => {
    const { container } = renderSlide();

    expect(
      container.querySelector("[data-slot='card-title'] svg"),
    ).not.toBeInTheDocument();
  });
});
