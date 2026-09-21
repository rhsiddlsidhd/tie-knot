import { describe, expect, it } from "vitest";
import { filterReducer, initialFilterState } from "./reducer";
import type { ProductFilterState } from "./type";

const buildState = (
  overrides: Partial<ProductFilterState> = {},
): ProductFilterState => ({
  ...initialFilterState,
  ...overrides,
});

describe("filterReducer", () => {
  it("CHANGE_KEYWORD는 keyword만 갱신하고 나머지 필드는 유지한다", () => {
    const state = buildState({ sortBy: "POPULAR" });

    const result = filterReducer(state, {
      type: "CHANGE_KEYWORD",
      payload: "청첩장",
    });

    expect(result).toEqual({ ...state, keyword: "청첩장" });
  });

  it("OPEN_SUGGESTIONS는 isOpen을 true로 만든다", () => {
    const state = buildState({ isOpen: false });

    const result = filterReducer(state, { type: "OPEN_SUGGESTIONS" });

    expect(result.isOpen).toBe(true);
  });

  it("CLOSE_SUGGESTIONS는 isOpen을 false로 만든다", () => {
    const state = buildState({ isOpen: true });

    const result = filterReducer(state, { type: "CLOSE_SUGGESTIONS" });

    expect(result.isOpen).toBe(false);
  });

  it("SELECT_SORT_BY는 sortBy를 갱신한다", () => {
    const state = buildState({ sortBy: "ALL" });

    const result = filterReducer(state, {
      type: "SELECT_SORT_BY",
      payload: "POPULAR",
    });

    expect(result.sortBy).toBe("POPULAR");
  });

  it("SELECT_PRICE는 price를 갱신한다", () => {
    const state = buildState({ price: "ALL" });

    const result = filterReducer(state, {
      type: "SELECT_PRICE",
      payload: "UNDER-10k",
    });

    expect(result.price).toBe("UNDER-10k");
  });

  it("SELECT_PREMIUM_FEAT는 포함되지 않은 값을 추가한다", () => {
    const state = buildState({ premiumFeat: ["gold-foil"] });

    const result = filterReducer(state, {
      type: "SELECT_PREMIUM_FEAT",
      payload: "letterpress",
    });

    expect(result.premiumFeat).toEqual(["gold-foil", "letterpress"]);
  });

  it("SELECT_PREMIUM_FEAT는 이미 포함된 값을 제거한다(토글)", () => {
    const state = buildState({ premiumFeat: ["gold-foil", "letterpress"] });

    const result = filterReducer(state, {
      type: "SELECT_PREMIUM_FEAT",
      payload: "gold-foil",
    });

    expect(result.premiumFeat).toEqual(["letterpress"]);
  });

  it("CLEAR_DETAIL_FILTER는 price와 premiumFeat만 초기화하고 keyword는 유지한다", () => {
    const state = buildState({
      keyword: "청첩장",
      price: "UNDER-10k",
      premiumFeat: ["gold-foil"],
    });

    const result = filterReducer(state, {
      type: "CLEAR_DETAIL_FILTER",
      payload: null,
    });

    expect(result).toEqual({
      ...state,
      price: "ALL",
      premiumFeat: [],
    });
  });

  it("RESET_ALL은 상태 전체를 초기값으로 되돌린다", () => {
    const state = buildState({
      keyword: "청첩장",
      isOpen: true,
      sortBy: "POPULAR",
      price: "UNDER-10k",
      premiumFeat: ["gold-foil"],
    });

    const result = filterReducer(state, { type: "RESET_ALL" });

    expect(result).toEqual(initialFilterState);
  });

  it("알 수 없는 action type이면 상태를 그대로 반환한다", () => {
    const state = buildState({ keyword: "청첩장" });

    const result = filterReducer(state, { type: "UNKNOWN_ACTION" } as never);

    expect(result).toBe(state);
  });
});
