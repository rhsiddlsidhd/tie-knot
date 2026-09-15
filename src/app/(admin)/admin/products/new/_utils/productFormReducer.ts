import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import type {
  ProductFormAction,
  ProductFormState,
} from "../_types/productForm";

const initialProductFormState: ProductFormState = {
  category: MOBILE_INVITATION_CATEGORY,
  subCategory: "",
  theme: "default",
  isPremium: false,
  isFeature: false,
  featureIds: [],
  priceError: null,
  // 등록 폼 초기값 1 — 서버 defaultValue와 일치.
  minQuantity: 1,
  // 등록 폼 초기값 true — mongoose default(maxQuantity: 0)와 일치.
  isUnlimitedMax: true,
  activeStep: "basic",
  stepErrors: {},
};

const withoutStepError = (
  state: ProductFormState,
  step: ProductFormState["activeStep"],
): ProductFormState["stepErrors"] => {
  if (!state.stepErrors[step]) return state.stepErrors;

  const next = { ...state.stepErrors };
  delete next[step];
  return next;
};

const productFormReducer = (
  state: ProductFormState,
  action: ProductFormAction,
): ProductFormState => {
  switch (action.type) {
    case "CHANGE_CATEGORY":
      return {
        ...state,
        category: action.payload,
        subCategory: "",
        stepErrors: withoutStepError(state, "basic"),
      };

    case "CHANGE_SUB_CATEGORY":
      return {
        ...state,
        subCategory: action.payload,
        stepErrors: withoutStepError(state, "basic"),
      };

    case "CHANGE_THEME":
      return { ...state, theme: action.payload };

    // 프리미엄을 끄면 선택한 옵션도 의미가 없어지므로 함께 비운다.
    case "TOGGLE_PREMIUM":
      return {
        ...state,
        isPremium: action.payload,
        featureIds: action.payload ? state.featureIds : [],
        stepErrors: withoutStepError(state, "pricing"),
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

      return {
        ...state,
        featureIds,
        stepErrors: withoutStepError(state, "pricing"),
      };
    }

    case "SET_PRICE_ERROR":
      return { ...state, priceError: action.payload };

    case "CHANGE_MIN_QUANTITY":
      return { ...state, minQuantity: action.payload };

    case "TOGGLE_UNLIMITED_MAX":
      return { ...state, isUnlimitedMax: action.payload };

    case "OPEN_STEP":
      return { ...state, activeStep: action.payload };

    case "FAIL_STEP":
      return {
        ...state,
        activeStep: action.payload.step,
        stepErrors: {
          ...state.stepErrors,
          [action.payload.step]: action.payload.message,
        },
      };

    case "CLEAR_STEP_ERROR": {
      const stepErrors = withoutStepError(state, action.payload);
      if (stepErrors === state.stepErrors) return state;

      return { ...state, stepErrors };
    }

    // 카테고리·서브 카테고리·테마는 연속 등록에서 이어 쓰므로 유지한다.
    case "RESET_AFTER_CONTINUE":
      return {
        ...initialProductFormState,
        category: state.category,
        subCategory: state.subCategory,
        theme: state.theme,
      };

    default:
      return state;
  }
};

export { initialProductFormState, productFormReducer };
