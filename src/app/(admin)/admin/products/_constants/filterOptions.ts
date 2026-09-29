import type {
  AdminProductTypeFilter,
  AdminProductView,
  EditableProductStatus,
} from "@/core/domain/product";
import { PRODUCT_STATUS_LABELS } from "@/core/domain/product";
import type { FilterToggleGroupOption } from "@/ui/components/molecules/FilterToggleGroup/FilterToggleGroup";

// null은 view 파라미터가 없는 기본 보기(상품 목록)다.
const VIEW_FILTER_OPTIONS: ReadonlyArray<
  FilterToggleGroupOption<AdminProductView>
> = [
  { value: null, label: "상품 목록" },
  { value: "trash", label: "휴지통" },
];

const STATUS_FILTER_OPTIONS: ReadonlyArray<
  FilterToggleGroupOption<EditableProductStatus>
> = [
  { value: null, label: "전체 상태" },
  { value: "active", label: PRODUCT_STATUS_LABELS.active },
  { value: "inactive", label: PRODUCT_STATUS_LABELS.inactive },
  { value: "soldOut", label: PRODUCT_STATUS_LABELS.soldOut },
];

const TYPE_FILTER_OPTIONS: ReadonlyArray<
  FilterToggleGroupOption<AdminProductTypeFilter>
> = [
  { value: null, label: "전체 타입" },
  { value: "premium", label: "프리미엄" },
  { value: "featured", label: "추천" },
];

export { VIEW_FILTER_OPTIONS, STATUS_FILTER_OPTIONS, TYPE_FILTER_OPTIONS };
