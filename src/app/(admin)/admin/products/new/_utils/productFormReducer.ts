import { MOBILE_INVITATION_CATEGORY } from "@/core/domain/product-category";
import { productFormFieldsReducer } from "@/core/utils/product-form";
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
    // 기본 정보 스텝 입력이 바뀌면 그 스텝에 남아있던 오류도 함께 지운다.
    case "CHANGE_CATEGORY":
    case "CHANGE_SUB_CATEGORY":
      return {
        ...productFormFieldsReducer(state, action),
        stepErrors: withoutStepError(state, "basic"),
      };

    // 가격 스텝 입력이 바뀌면 그 스텝에 남아있던 오류도 함께 지운다.
    case "TOGGLE_PREMIUM":
    case "TOGGLE_PREMIUM_FEATURE":
      return {
        ...productFormFieldsReducer(state, action),
        stepErrors: withoutStepError(state, "pricing"),
      };

    case "SET_PRICE_ERROR":
      return { ...state, priceError: action.payload };

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
      return productFormFieldsReducer(state, action);
  }
};

export { initialProductFormState, productFormReducer };
