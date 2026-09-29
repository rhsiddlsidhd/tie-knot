import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { useOffsetListMock, deleteProductMock } = vi.hoisted(() => ({
  useOffsetListMock: vi.fn(),
  deleteProductMock: vi.fn(),
}));

vi.mock("@/ui/hooks/useOffsetList", () => ({
  useOffsetList: useOffsetListMock,
}));
vi.mock("@/actions/deleteProduct", () => ({
  deleteProduct: deleteProductMock,
}));
vi.mock("@/actions/restoreProduct", () => ({ restoreProduct: vi.fn() }));
vi.mock("@/actions/permanentlyDeleteProduct", () => ({
  permanentlyDeleteProduct: vi.fn(),
}));
vi.mock("@/actions/updateProductStatus", () => ({
  updateProductStatus: vi.fn(),
}));

import type { Product } from "@/core/domain/product";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import { createAppStore } from "@/ui/stores/app.store";
import type { AppStoreApi } from "@/ui/stores/app.store";
import { StoreProvider } from "@/ui/stores/provider";
import { AdminProductsTable } from "./AdminProductsTable";

const buildProduct = (overrides?: Partial<Product>): Product => ({
  _id: "507f1f77bcf86cd799439011",
  authorId: "507f1f77bcf86cd799439012",
  title: "봄맞이 청첩장",
  description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
  thumbnail: "https://example.com/thumbnail.jpg",
  price: 9900,
  category: MOBILE_INVITATION_CATEGORY,
  subCategory: "wedding",
  isPremium: false,
  featureIds: [],
  isFeatured: false,
  priority: 0,
  likes: [],
  views: 0,
  salesCount: 0,
  discount: { discountType: "rate", value: 0 },
  status: "active",
  theme: "default",
  isLiked: false,
  discountedPrice: 9900,
  images: [],
  minQuantity: 1,
  maxQuantity: 0,
  createdAt: "2026-09-01T03:00:00.000Z",
  updatedAt: "2026-09-01T03:00:00.000Z",
  ratingAverage: 0,
  ratingCount: 0,
  deletedAt: null,
  ...overrides,
});

const buildTable = (overrides: Record<string, unknown> = {}) => ({
  items: [buildProduct()],
  pageInfo: { total: 21, totalPages: 3 },
  isLoading: false,
  isValidating: false,
  error: undefined as { message: string } | undefined,
  mutate: vi.fn(),
  page: 1,
  q: "",
  sortState: null as { key: string; direction: "asc" | "desc" } | null,
  params: {} as { view?: string },
  setPage: vi.fn(),
  setSearch: vi.fn(),
  toggleSort: vi.fn(),
  setParam: vi.fn(),
  ...overrides,
});

let testStore: AppStoreApi;

const renderTable = () =>
  render(
    <StoreProvider store={testStore}>
      <AdminProductsTable />
    </StoreProvider>,
  );

const columnHeaders = () =>
  screen.getAllByRole("columnheader").map((header) => header.textContent);

afterEach(() => vi.useRealTimers());

describe("AdminProductsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testStore = createAppStore();
  });

  it("관리자 상품 API를 view 파라미터와 함께 조회한다", () => {
    useOffsetListMock.mockReturnValue(buildTable());
    renderTable();

    expect(useOffsetListMock).toHaveBeenCalledWith({
      endpoint: "/api/admin/products",
      params: ["view"],
    });
  });

  it("상품 목록 view는 제목·등록 버튼·상태 열을 렌더링한다", () => {
    useOffsetListMock.mockReturnValue(buildTable());
    renderTable();

    expect(
      screen.getByRole("heading", { name: "상품 목록" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("등록된 템플릿 상품을 관리합니다."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "상품 등록" })).toHaveAttribute(
      "href",
      "/admin/products/new",
    );
    expect(screen.getByRole("radio", { name: "상품 목록" })).toBeChecked();
    expect(columnHeaders()).toEqual([
      "썸네일",
      "상품명",
      "카테고리",
      "가격",
      "타입",
      "상태",
      "조회수",
      "좋아요",
      "판매량",
      "우선순위",
      "등록일",
      "관리",
    ]);
  });

  it("휴지통 view는 제목을 바꾸고 등록 버튼 없이 삭제일 열을 렌더링한다", () => {
    useOffsetListMock.mockReturnValue(
      buildTable({
        params: { view: "trash" },
        items: [buildProduct({ deletedAt: "2026-09-10T03:00:00.000Z" })],
      }),
    );
    renderTable();

    expect(screen.getByRole("heading", { name: "휴지통" })).toBeInTheDocument();
    expect(
      screen.getByText("삭제된 상품을 조회하고 복구합니다."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "상품 등록" }),
    ).not.toBeInTheDocument();
    expect(columnHeaders()[5]).toBe("삭제일");
    expect(screen.getByRole("button", { name: "복구" })).toBeInTheDocument();
  });

  it("휴지통 view에서 상품 목록을 고르면 view 파라미터를 지운다", async () => {
    const table = buildTable({ params: { view: "trash" } });
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("radio", { name: "상품 목록" }));

    expect(table.setParam).toHaveBeenCalledWith("view", undefined);
  });

  it("상품 목록 view에서 휴지통을 고르면 view=trash로 바꾼다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("radio", { name: "휴지통" }));

    expect(table.setParam).toHaveBeenCalledWith("view", "trash");
  });

  it("통계·등록일 열로 정렬을 바꾸고 휴지통에서는 삭제일로 정렬한다", async () => {
    const table = buildTable({ params: { view: "trash" } });
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "좋아요 정렬" }));
    await user.click(screen.getByRole("button", { name: "등록일 정렬" }));
    await user.click(screen.getByRole("button", { name: "삭제일 정렬" }));

    expect(table.toggleSort.mock.calls).toEqual([
      ["likesCount"],
      ["createdAt"],
      ["deletedAt"],
    ]);
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
      target: { value: "청첩장" },
    });
    act(() => vi.advanceTimersByTime(300));

    expect(table.setSearch).toHaveBeenCalledWith("청첩장");
  });

  it("상품을 삭제하면 목록을 다시 조회한다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    deleteProductMock.mockResolvedValue({
      success: true,
      data: { message: "상품이 성공적으로 삭제되었습니다." },
    });
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "상품 삭제" }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "삭제",
      }),
    );

    expect(deleteProductMock).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(table.mutate).toHaveBeenCalledOnce();
  });

  it("수정 모달에 목록 갱신 callback을 넘긴다", async () => {
    const table = buildTable();
    useOffsetListMock.mockReturnValue(table);
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "상품 수정" }));
    const props = testStore.getState().props as { onRefreshed: () => void };
    props.onRefreshed();

    expect(testStore.getState().adminModalType).toBe("EDIT-PRODUCT");
    expect(table.mutate).toHaveBeenCalledOnce();
  });

  it("상품 목록 view의 빈 목록 문구를 보여준다", () => {
    useOffsetListMock.mockReturnValue(
      buildTable({ items: [], pageInfo: { total: 0, totalPages: 0 } }),
    );
    renderTable();

    expect(screen.getByText("등록된 상품이 없습니다.")).toBeInTheDocument();
  });

  it("휴지통 view의 빈 목록 문구를 보여준다", () => {
    useOffsetListMock.mockReturnValue(
      buildTable({
        items: [],
        pageInfo: { total: 0, totalPages: 0 },
        params: { view: "trash" },
      }),
    );
    renderTable();

    expect(screen.getByText("삭제된 상품이 없습니다.")).toBeInTheDocument();
  });

  it("검색 결과가 비었으면 검색 빈 결과 문구를 보여준다", () => {
    useOffsetListMock.mockReturnValue(
      buildTable({
        items: [],
        pageInfo: { total: 0, totalPages: 0 },
        q: "없는 상품",
      }),
    );
    renderTable();

    expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument();
    expect(
      screen.queryByText("등록된 상품이 없습니다."),
    ).not.toBeInTheDocument();
  });
});
