import type { ProductStatus } from "@/core/domain/product";
import type {
  ProductFormFields,
  ProductFormFieldsAction,
} from "@/core/domain/product-form";

/** 공용 상품 속성에 수정 폼 전용 상태를 더한 것이 수정 폼의 상태다. */
interface ProductEditFormState extends ProductFormFields {
  status: ProductStatus;
  // 무제한 Input이 마운트될 때 쓸 defaultValue — 최초엔 기존 상품 값(product.maxQuantity)을
  // 보존하고, 체크박스를 다시 해제할 때만 minQuantity 기반 제안값으로 갱신한다.
  maxQuantityDefault: number;
}

type ProductEditFormAction =
  | ProductFormFieldsAction
  | { type: "CHANGE_STATUS"; payload: ProductStatus };

export type { ProductEditFormAction, ProductEditFormState };
