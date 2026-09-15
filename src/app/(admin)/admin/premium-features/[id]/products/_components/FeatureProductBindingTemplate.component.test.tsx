import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { FeatureProductBindingPage } from "@/core/domain/premium-feature";

vi.mock(
  "@/app/(admin)/admin/premium-features/[id]/products/_containers/FeatureProductBindingRow",
  () => ({
    FeatureProductBindingRow: ({
      product,
    }: {
      product: { title: string; attached: boolean };
    }) => (
      <tr>
        <td>{`${product.title}:${product.attached}`}</td>
      </tr>
    ),
  }),
);

import { FeatureProductBindingTemplate } from "./FeatureProductBindingTemplate";

const buildPage = (
  overrides?: Partial<FeatureProductBindingPage>,
): FeatureProductBindingPage => ({
  items: [
    {
      _id: "product-1",
      title: "봄맞이 청첩장",
      price: 9900,
      status: "active",
      attached: true,
    },
  ],
  nextCursor: null,
  ...overrides,
});

const renderTemplate = (
  props?: Partial<Parameters<typeof FeatureProductBindingTemplate>[0]>,
) =>
  render(
    <FeatureProductBindingTemplate
      featureId="feature-1"
      featureLabel="갤러리 확대 보기"
      page={buildPage()}
      {...props}
    />,
  );

describe("FeatureProductBindingTemplate", () => {
  it("어떤 기능을 연결하는 화면인지 제목에 담는다", () => {
    renderTemplate();

    expect(screen.getByText(/갤러리 확대 보기/)).toBeInTheDocument();
  });

  it("상품 행을 렌더링한다", () => {
    renderTemplate();

    expect(screen.getByText("봄맞이 청첩장:true")).toBeInTheDocument();
  });

  it("검색 입력은 현재 검색어를 기본값으로 갖는다", () => {
    renderTemplate({ q: "봄맞이" });

    expect(screen.getByRole("searchbox", { name: /상품 검색/ })).toHaveValue(
      "봄맞이",
    );
  });

  // 검색 폼에 cursor를 싣지 않아 새 검색이 항상 첫 페이지에서 시작한다(#309 규약).
  it("검색 폼은 cursor를 함께 보내지 않는다", () => {
    const { container } = renderTemplate({ q: "봄맞이", cursor: "abc" });
    const form = container.querySelector("form");

    expect(within(form!).queryByDisplayValue("abc")).toBeNull();
  });

  it("결과가 없으면 검색어를 지우라는 안내를 보여준다", () => {
    renderTemplate({ page: buildPage({ items: [] }), q: "없는상품" });

    expect(screen.getByText(/검색어를 지우면/)).toBeInTheDocument();
  });

  it("프리미엄 상품 자체가 없으면 다른 안내를 보여준다", () => {
    renderTemplate({ page: buildPage({ items: [] }) });

    expect(screen.getByText(/프리미엄 상품이 없습니다/)).toBeInTheDocument();
  });

  it("기능 목록으로 돌아가는 링크를 제공한다", () => {
    renderTemplate();

    expect(
      screen.getByRole("link", { name: /기능 목록/ }),
    ).toHaveAttribute("href", "/admin/premium-features");
  });
});
