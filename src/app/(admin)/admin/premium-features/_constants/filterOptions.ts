import type { AdminPremiumFeatureStatusFilter } from "@/core/domain/premium-feature";
import type { FilterSelectOption } from "@/ui/components/molecules/FilterSelect/FilterSelect";

const STATUS_FILTER_OPTIONS: ReadonlyArray<
  FilterSelectOption<AdminPremiumFeatureStatusFilter>
> = [
  { value: "active", label: "등록 가능" },
  { value: "inactive", label: "등록 중단" },
];

export { STATUS_FILTER_OPTIONS };
