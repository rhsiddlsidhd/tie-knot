import type { Product } from "@/core/domain/product";
import { productFormFieldsReducer } from "@/core/utils/product-form";
import type {
  ProductEditFormAction,
  ProductEditFormState,
} from "../_types/productEditForm";

/** 수정 폼은 등록 폼과 달리 초기값이 기존 상품에서 온다. */
const createProductEditFormState = (
  product: Product,
): ProductEditFormState => ({
  category: product.category,
  subCategory: product.subCategory,
  theme: product.theme ?? "default",
  isPremium: product.isPremium,
  isFeature: product.isFeatured,
  featureIds: product.featureIds || [],
  minQuantity: product.minQuantity,
  isUnlimitedMax: product.maxQuantity === 0,
  status: product.status,
  maxQuantityDefault: product.maxQuantity > 0 ? product.maxQuantity : 1,
});

const productEditFormReducer = (
  state: ProductEditFormState,
  action: ProductEditFormAction,
): ProductEditFormState => {
  switch (action.type) {
    case "CHANGE_STATUS":
      return { ...state, status: action.payload };

    // 무제한을 해제할 때만 최대 수량 defaultValue를 최소 수량 기반 제안값으로 갱신한다.
    case "TOGGLE_UNLIMITED_MAX": {
      const next = productFormFieldsReducer(state, action);
      if (action.payload) return next;

      return {
        ...next,
        maxQuantityDefault: Number.isNaN(state.minQuantity)
          ? 1
          : Math.max(1, state.minQuantity),
      };
    }

    default:
      return productFormFieldsReducer(state, action);
  }
};

export { createProductEditFormState, productEditFormReducer };
