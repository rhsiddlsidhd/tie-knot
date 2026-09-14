import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import { ProductFeatures } from "./ProductFeatures";

const buildFeature = (overrides?: Partial<PremiumFeature>): PremiumFeature => ({
  _id: "feature-1",
  code: "CUSTOM_FONT",
  label: "나만의 폰트",
  description: "원하는 폰트를 직접 지정할 수 있습니다.",
  additionalPrice: 3000,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("ProductFeatures", () => {
  it("옵션 목록의 라벨과 설명을 렌더링한다", () => {
    render(
      <ProductFeatures
        options={[
          buildFeature({ label: "나만의 폰트", description: "원하는 폰트를 직접 지정할 수 있습니다." }),
          buildFeature({ _id: "feature-2", label: "비디오 추가", description: "영상을 추가할 수 있습니다." }),
        ]}
        images={[]}
      />,
    );

    expect(screen.getByText("나만의 폰트")).toBeInTheDocument();
    expect(screen.getByText("원하는 폰트를 직접 지정할 수 있습니다.")).toBeInTheDocument();
    expect(screen.getByText("비디오 추가")).toBeInTheDocument();
    expect(screen.getByText("영상을 추가할 수 있습니다.")).toBeInTheDocument();
  });

  it("옵션이 없으면 옵션 카드를 렌더링하지 않는다", () => {
    render(<ProductFeatures options={[]} images={[]} />);

    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
  });

  it("상세 이미지가 없으면 안내 문구를 보여준다", () => {
    render(<ProductFeatures options={[]} images={[]} />);

    expect(
      screen.getByText("상세 이미지가 아직 등록되지 않았습니다."),
    ).toBeInTheDocument();
  });

  it("이미지가 노출 개수 이하이면 더보기 버튼을 렌더링하지 않는다", () => {
    render(<ProductFeatures options={[]} images={["/images/detail-1.jpg"]} />);

    expect(screen.getByAltText("상세 이미지 1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "더보기" })).not.toBeInTheDocument();
  });

  it("이미지가 노출 개수보다 많으면 더보기 버튼으로 나머지 이미지를 펼친다", async () => {
    const user = userEvent.setup();
    render(
      <ProductFeatures
        options={[]}
        images={["/images/detail-1.jpg", "/images/detail-2.jpg", "/images/detail-3.jpg"]}
      />,
    );

    expect(screen.getByAltText("상세 이미지 1")).toBeInTheDocument();
    expect(screen.queryByAltText("상세 이미지 2")).not.toBeInTheDocument();

    const toggleButton = screen.getByRole("button", { name: "더보기" });
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    await user.click(toggleButton);

    expect(screen.getByAltText("상세 이미지 2")).toBeInTheDocument();
    expect(screen.getByAltText("상세 이미지 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "접기" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
