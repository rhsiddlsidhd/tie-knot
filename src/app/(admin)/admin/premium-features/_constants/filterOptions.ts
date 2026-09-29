import type { AdminPremiumFeatureStatusFilter } from "@/core/domain/premium-feature";
import type { FilterToggleGroupOption } from "@/ui/components/molecules/FilterToggleGroup/FilterToggleGroup";

const STATUS_FILTER_OPTIONS: ReadonlyArray<
  FilterToggleGroupOption<AdminPremiumFeatureStatusFilter>
> = [
  { value: null, label: "전체" },
  { value: "active", label: "등록 가능" },
  { value: "inactive", label: "등록 중단" },
];

export { STATUS_FILTER_OPTIONS };
