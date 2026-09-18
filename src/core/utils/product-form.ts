import type {
  ProductFormFields,
  ProductFormFieldsAction,
} from "@/core/domain/product-form";

/**
 * 등록 폼과 수정 폼이 공유하는 상품 속성 전이만 담당한다 — 스텝 오류나 판매 상태처럼
 * 한쪽 화면에만 있는 상태는 각 화면의 reducer가 이 결과를 감싸서 덧붙인다.
 */
const productFormFieldsReducer = <T extends ProductFormFields>(
  state: T,
  action: ProductFormFieldsAction,
): T => {
  switch (action.type) {
    // 카테고리를 바꾸면 이전 서브 카테고리는 선택지에 없으므로 함께 비운다.
    case "CHANGE_CATEGORY":
      return { ...state, category: action.payload, subCategory: "" };

    case "CHANGE_SUB_CATEGORY":
      return { ...state, subCategory: action.payload };

    case "CHANGE_THEME":
      return { ...state, theme: action.payload };

    // 프리미엄을 끄면 선택한 옵션도 의미가 없어지므로 함께 비운다.
    case "TOGGLE_PREMIUM":
      return {
        ...state,
        isPremium: action.payload,
        featureIds: action.payload ? state.featureIds : [],
      };

    case "TOGGLE_FEATURED":
      return { ...state, isFeature: action.payload };

    case "TOGGLE_PREMIUM_FEATURE": {
      const { id, checked } = action.payload;
      const featureIds = checked
        ? state.featureIds.includes(id)
          ? state.featureIds
          : [...state.featureIds, id]
        : state.featureIds.filter((featureId) => featureId !== id);

      return { ...state, featureIds };
    }

    case "CHANGE_MIN_QUANTITY":
      return { ...state, minQuantity: action.payload };

    case "TOGGLE_UNLIMITED_MAX":
      return { ...state, isUnlimitedMax: action.payload };

    default:
      return state;
  }
};

export { productFormFieldsReducer };
