import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { useOffsetListMock, setProductPremiumFeatureMock } = vi.hoisted(() => ({
  useOffsetListMock: vi.fn(),
  setProductPremiumFeatureMock: vi.fn(),
}));

vi.mock("@/ui/hooks/useOffsetList", () => ({
  useOffsetList: useOffsetListMock,
}));
vi.mock("@/actions/setProductPremiumFeature", () => ({
  setProductPremiumFeature: setProductPremiumFeatureMock,
}));

import {
  FEATURE_PRODUCT_BINDING_SORT_KEYS,
  FEATURE_PRODUCT_BINDING_STATUS_FILTERS,
} from "@/core/domain/premium-feature";
import { FeatureProductBindingTable } from "./FeatureProductBindingTable";

const buildTable = (overrides: Record<string, unknown> = {}) => ({
  items: [
    {
      _id: "product-1",
      title: "봄맞이 청첩장",
      price: 9900,
      status: "active",
      attached: false,
    },
  ],
  pageInfo: { total: 21, totalPages: 3 },
  isLoading: false,
  isValidating: false,
  error: undefined as { message: string } | undefined,
  mutate: vi.fn(),
  page: 1,
  q: "",
  sortState: null as { key: string; direction: "asc" | "desc" } | null,
  params: { attached: null } as { attached: string | null },
  setPage: vi.fn(),
  setSearch: vi.fn(),
  toggleSort: vi.fn(),
  setParam: vi.fn(),
  ...overrides,
});

const renderTable = () =>
  render(
    <FeatureProductBindingTable
      featureId="feature-1"
      featureLabel="갤러리 확대 보기"
    />,
  );

afterEach(() => vi.useRealTimers());

describe("FeatureProductBindingTable", () => {
  beforeEach(() => vi.clearAllMocks());

  it("기능별 연결 상품 API를 조회하고 제목·돌아가기 링크·열을 렌더링한다", () => {
    useOffsetListMock.mockReturnValue(buildTable());
    renderTable();

    expect(useOffsetListMock).toHaveBeenCalledWith({
      endpoint: "/api/admin/premium-features/feature-1/products",
      sortKeys: FEATURE_PRODUCT_BINDING_SORT_KEYS,
      params: { attached: FEATURE_PRODUCT_BINDING_STATUS_FILTERS },
    });
    expect(
      screen.getByRole("heading", { name: '"갤러리 확대 보기" 연결 상품' }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "기능 목록" })).toHaveAttribute(
      "href",
      "/admin/premium-features",
    );
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(["연결", "상품명", "가격", "상태"]);
    expect(screen.getByText("봄맞이 청첩장")).toBeInTheDocument();
  });

  it("연결 여부 필터를 고르면 attached 파라미터를 바꾼다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("combobox", { name: "연결 여부 필터" }));
    await user.click(await screen.findByRole("option", { name: "연결됨" }));

    expect(table.setParam).toHaveBeenCalledWith("attached", "attached");
  });

  it("상품명·가격 열로 정렬을 바꾼다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "상품명 정렬" }));
    await user.click(screen.getByRole("button", { name: "가격 정렬" }));

    expect(table.toggleSort.mock.calls).toEqual([["title"], ["price"]]);
  });

  it("페이지 버튼을 누르면 해당 페이지로 이동한다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "2페이지" }));

    expect(table.setPage).toHaveBeenCalledWith(2);
  });

  it("검색어를 입력하면 debounce 뒤 검색을 반영한다", () => {
    vi.useFakeTimers();
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    renderTable();

    fireEvent.change(screen.getByRole("searchbox", { name: "상품 검색" }), {
      target: { value: "봄맞이" },
    });
    act(() => vi.advanceTimersByTime(300));

    expect(table.setSearch).toHaveBeenCalledWith("봄맞이");
  });

  it("연결을 바꾸면 목록을 다시 조회한다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    setProductPremiumFeatureMock.mockResolvedValue({
      success: true,
      data: { message: "상품에 기능을 연결했습니다." },
    });
    const user = userEvent.setup();
    renderTable();

    await user.click(
      screen.getByRole("checkbox", { name: "봄맞이 청첩장 연결" }),
    );

    expect(setProductPremiumFeatureMock).toHaveBeenCalledWith({
      productId: "product-1",
      featureId: "feature-1",
      attached: true,
    });
    expect(table.mutate).toHaveBeenCalledOnce();
  });
});
