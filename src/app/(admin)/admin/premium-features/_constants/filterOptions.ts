import type { AdminPremiumFeatureStatusFilter } from "@/core/domain/premium-feature";
import type { AllOptionSelectOption } from "@/ui/components/molecules/AllOptionSelect/AllOptionSelect";

const STATUS_FILTER_OPTIONS: ReadonlyArray<
  AllOptionSelectOption<AdminPremiumFeatureStatusFilter>
> = [
  { value: null, label: "전체" },
  { value: "active", label: "등록 가능" },
  { value: "inactive", label: "등록 중단" },
];

export { STATUS_FILTER_OPTIONS };
