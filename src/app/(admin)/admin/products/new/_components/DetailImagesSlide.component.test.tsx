import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DetailImagesSlide } from "./DetailImagesSlide";

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

const buildItem = (id: string) => ({
  id,
  preview: `https://example.com/${id}.png`,
  url: `https://example.com/${id}.png`,
});

const renderSlide = (
  overrides: Partial<Parameters<typeof DetailImagesSlide>[0]> = {},
) =>
  render(
    <DetailImagesSlide
      state={null}
      items={[]}
      isMobileInvitation
      onAdd={vi.fn()}
      onRemove={vi.fn()}
      onPrevious={vi.fn()}
      onNext={vi.fn()}
      {...overrides}
    />,
  );

describe("DetailImagesSlide", () => {
  it("등록한 이미지마다 hidden 필드를 만든다", () => {
    const { container } = renderSlide({
      items: [buildItem("a"), buildItem("b")],
    });

    expect(container.querySelectorAll("input[name='images']")).toHaveLength(2);
  });

  it("모바일 청첩장이면 선택사항으로 안내한다", () => {
    renderSlide();

    expect(
      screen.getByText("선택사항입니다. 등록하지 않아도 됩니다."),
    ).toBeInTheDocument();
  });

  it("실물 상품이면 최소 1장을 요구한다", () => {
    const { container } = renderSlide({ isMobileInvitation: false });

    expect(
      screen.getByText(
        "상품 상세 페이지에 표시될 이미지를 최소 1장 등록해주세요.",
      ),
    ).toBeInTheDocument();
    expect(
      container.querySelector("[data-slot='card-title'] svg"),
    ).toBeInTheDocument();
  });

  it("스텝 오류 메시지를 표시한다", () => {
    renderSlide({ stepError: "상세 이미지를 1장 이상 등록해주세요." });

    expect(
      screen.getByText("상세 이미지를 1장 이상 등록해주세요."),
    ).toBeInTheDocument();
  });
});
