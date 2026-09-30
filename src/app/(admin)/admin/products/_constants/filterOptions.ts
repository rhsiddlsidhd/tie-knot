import type {
  AdminProductTypeFilter,
  EditableProductStatus,
} from "@/core/domain/product";
import { PRODUCT_STATUS_LABELS } from "@/core/domain/product";
import type { AllOptionSelectOption } from "@/ui/components/molecules/AllOptionSelect/AllOptionSelect";

const STATUS_FILTER_OPTIONS: ReadonlyArray<
  AllOptionSelectOption<EditableProductStatus>
> = [
  { value: "active", label: PRODUCT_STATUS_LABELS.active },
  { value: "inactive", label: PRODUCT_STATUS_LABELS.inactive },
  { value: "soldOut", label: PRODUCT_STATUS_LABELS.soldOut },
];

const TYPE_FILTER_OPTIONS: ReadonlyArray<
  AllOptionSelectOption<AdminProductTypeFilter>
> = [
  { value: "premium", label: "프리미엄" },
  { value: "featured", label: "추천" },
];

export { STATUS_FILTER_OPTIONS, TYPE_FILTER_OPTIONS };
