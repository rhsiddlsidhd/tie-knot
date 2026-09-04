import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { initialFilterState } from "@/ui/context/productFilter/reducer";
import type { Product } from "@/core/domain/product";
import type { PremiumFeature } from "@/core/domain/premium-feature";
import type { SubCategory } from "@/core/domain/product-category";
import { ProductFilters } from "./ProductFilters";
import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const buildProduct = (overrides?: Partial<Product>): Product =>
  ({
    _id: "product-1",
    authorId: "author-1",
    title: "봄맞이 청첩장",
    description: "봄 시즌 한정 모바일 청첩장 템플릿입니다.",
    thumbnail: "https://example.com/thumb.jpg",
    price: 10000,
    category: MOBILE_INVITATION_CATEGORY,
    subCategory: "wedding",
    isPremium: false,
    isFeatured: false,
    priority: 0,
    discount: { discountType: "rate", value: 0 },
    status: "active",
    likes: [],
    featureIds: [],
    isLiked: false,
    discountedPrice: 10000,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  }) as Product;

// category는 object spread({...defaultProps})를 거치면 리터럴 타입이 string으로
// widen되는 TS의 알려진 동작(as const로 태그된 값만 spread에서 좁은 타입을 유지) 때문에
// 상수 참조 대신 리터럴에 직접 as const를 건다.
const defaultProps = {
  category: "mobile-invitation" as const,
  subCategory: "all" as const,
  availableSubCategories: [] as SubCategory[],
  premiumFeatures: [] as PremiumFeature[],
  state: initialFilterState,
  dispatch: vi.fn(),
};

describe("ProductFilters", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("state를 props로 받아 검색 키워드를 렌더링한다(Context 직접 구독하지 않음)", () => {
    render(
      <ProductFilters
        data={[buildProduct()]}
        {...defaultProps}
        state={{ ...initialFilterState, keyword: "봄맞이" }}
      />,
    );

    expect(screen.getByDisplayValue("봄맞이")).toBeInTheDocument();
  });

  it("검색창에 입력하면 dispatch로 CHANGE_KEYWORD를 전달한다", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();

    render(
      <ProductFilters data={[buildProduct()]} {...defaultProps} dispatch={dispatch} />,
    );

    await user.type(screen.getByPlaceholderText("상품 검색..."), "봄");

    expect(dispatch).toHaveBeenCalledWith({
      type: "CHANGE_KEYWORD",
      payload: "봄",
    });
  });

  it("서브카테고리 버튼 클릭 시 router.push로 해당 subCategory URL을 요청한다", async () => {
    const user = userEvent.setup();

    render(
      <ProductFilters
        data={[buildProduct()]}
        {...defaultProps}
        availableSubCategories={["wedding"]}
      />,
    );

    await user.click(screen.getByText("청첩장"));

    expect(pushMock).toHaveBeenCalledWith(
      `/products/${MOBILE_INVITATION_CATEGORY}?subCategory=wedding`,
    );
  });

  it("전체 버튼 클릭 시 router.push로 subCategory 쿼리 없는 URL을 요청한다", async () => {
    const user = userEvent.setup();

    render(
      <ProductFilters
        data={[buildProduct()]}
        {...defaultProps}
        subCategory="wedding"
        availableSubCategories={["wedding"]}
      />,
    );

    await user.click(screen.getByText("전체"));

    expect(pushMock).toHaveBeenCalledWith(`/products/${MOBILE_INVITATION_CATEGORY}`);
  });

  it("현재 subCategory와 일치하는 버튼을 활성 상태로 표시한다", () => {
    render(
      <ProductFilters
        data={[buildProduct()]}
        {...defaultProps}
        subCategory="wedding"
        availableSubCategories={["wedding"]}
      />,
    );

    expect(screen.getByRole("button", { name: "청첩장" })).toHaveClass("bg-primary");
    expect(screen.getByRole("button", { name: "전체" })).not.toHaveClass("bg-primary");
  });

  it("서버가 내려준 availableSubCategories 순서 그대로 전체 버튼과 함께 렌더링한다", () => {
    render(
      <ProductFilters
        data={[]}
        {...defaultProps}
        category="favor"
        availableSubCategories={["candle", "soap"]}
      />,
    );

    const filterLabels = screen
      .getAllByRole("button")
      .map((button) => button.textContent);

    expect(filterLabels.slice(0, 3)).toEqual(["전체", "캔들", "비누"]);
  });

  it("availableSubCategories가 비어 있으면 전체 버튼만 서브카테고리 필터로 렌더링한다", () => {
    render(
      <ProductFilters
        data={[]}
        {...defaultProps}
        category="favor"
        availableSubCategories={[]}
      />,
    );

    expect(screen.getByRole("button", { name: "전체" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "캔들" }),
    ).not.toBeInTheDocument();
  });

  it("검색창에 입력하면 OPEN_SUGGESTIONS도 함께 dispatch한다", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();

    render(
      <ProductFilters data={[buildProduct()]} {...defaultProps} dispatch={dispatch} />,
    );

    await user.type(screen.getByPlaceholderText("상품 검색..."), "봄");

    expect(dispatch).toHaveBeenCalledWith({ type: "OPEN_SUGGESTIONS" });
  });

  it("자동완성 목록에서 항목을 선택하면 CHANGE_KEYWORD와 CLOSE_SUGGESTIONS를 dispatch한다", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();

    render(
      <ProductFilters
        data={[buildProduct({ title: "봄맞이 청첩장" })]}
        {...defaultProps}
        state={{ ...initialFilterState, keyword: "봄", isOpen: true }}
        dispatch={dispatch}
      />,
    );

    await user.click(await screen.findByText("봄맞이 청첩장"));

    expect(dispatch).toHaveBeenCalledWith({
      type: "CHANGE_KEYWORD",
      payload: "봄맞이 청첩장",
    });
    expect(dispatch).toHaveBeenCalledWith({ type: "CLOSE_SUGGESTIONS" });
  });

  it("정렬 드롭다운에서 항목을 선택하면 dispatch로 SELECT_SORT_BY를 전달한다", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();

    render(
      <ProductFilters data={[buildProduct()]} {...defaultProps} dispatch={dispatch} />,
    );

    await user.click(screen.getByRole("button", { name: /모두/ }));
    await user.click(
      await screen.findByRole("menuitemradio", { name: "인기순" }),
    );

    expect(dispatch).toHaveBeenCalledWith({
      type: "SELECT_SORT_BY",
      payload: "POPULAR",
    });
  });

  it("상세 필터 버튼을 클릭하면 가격대/특별옵션 영역이 나타난다", async () => {
    const user = userEvent.setup();

    render(<ProductFilters data={[buildProduct()]} {...defaultProps} />);

    expect(screen.queryByText("가격대")).not.toBeInTheDocument();

    await user.click(screen.getByText("상세 필터"));

    expect(screen.getByText("가격대")).toBeInTheDocument();
    expect(screen.getByText("특별 옵션")).toBeInTheDocument();
  });

  it("가격대 배지를 클릭하면 dispatch로 SELECT_PRICE를 전달한다", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();

    render(
      <ProductFilters data={[buildProduct()]} {...defaultProps} dispatch={dispatch} />,
    );

    await user.click(screen.getByText("상세 필터"));
    await user.click(screen.getByText("무료"));

    expect(dispatch).toHaveBeenCalledWith({
      type: "SELECT_PRICE",
      payload: "FREE",
    });
  });

  it("특별 옵션 배지를 클릭하면 dispatch로 SELECT_PREMIUM_FEAT를 전달한다(라벨 매핑 사용)", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();

    render(
      <ProductFilters
        data={[buildProduct()]}
        {...defaultProps}
        premiumFeatures={[
          {
            _id: "feat-1",
            code: "VIDEO",
            label: "비디오",
            description: "",
            additionalPrice: 0,
            isActive: true,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ]}
        dispatch={dispatch}
      />,
    );

    await user.click(screen.getByText("상세 필터"));
    await user.click(screen.getByText("🎬 비디오 추가"));

    expect(dispatch).toHaveBeenCalledWith({
      type: "SELECT_PREMIUM_FEAT",
      payload: "feat-1",
    });
  });

  it("PREMIUM_FEATURE_LABELS에 없는 code는 value.label로 폴백한다", async () => {
    const user = userEvent.setup();

    render(
      <ProductFilters
        data={[buildProduct()]}
        {...defaultProps}
        premiumFeatures={[
          {
            _id: "feat-2",
            code: "UNKNOWN_CODE",
            label: "커스텀 라벨",
            description: "",
            additionalPrice: 0,
            isActive: true,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ]}
      />,
    );

    await user.click(screen.getByText("상세 필터"));

    expect(screen.getByText("커스텀 라벨")).toBeInTheDocument();
  });

  it("필터 초기화 버튼을 클릭하면 dispatch로 CLEAR_DETAIL_FILTER를 전달한다", async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();

    render(
      <ProductFilters data={[buildProduct()]} {...defaultProps} dispatch={dispatch} />,
    );

    await user.click(screen.getByText("상세 필터"));
    await user.click(screen.getByText("필터 초기화"));

    expect(dispatch).toHaveBeenCalledWith({
      type: "CLEAR_DETAIL_FILTER",
      payload: null,
    });
  });
});
