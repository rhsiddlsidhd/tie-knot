import type { AdminProductView } from "@/core/domain/product";
import type { FilterToggleGroupOption } from "@/ui/components/molecules/FilterToggleGroup/FilterToggleGroup";

// null은 view 파라미터가 없는 기본 보기(상품 목록)다.
const VIEW_FILTER_OPTIONS: ReadonlyArray<
  FilterToggleGroupOption<AdminProductView>
> = [
  { value: null, label: "상품 목록" },
  { value: "trash", label: "휴지통" },
];

export { VIEW_FILTER_OPTIONS };
