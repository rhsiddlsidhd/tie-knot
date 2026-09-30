import type { FeatureProductBindingStatusFilter } from "@/core/domain/premium-feature";
import type { FilterSelectOption } from "@/ui/components/molecules/FilterSelect/FilterSelect";

const ATTACHED_FILTER_OPTIONS: ReadonlyArray<
  FilterSelectOption<FeatureProductBindingStatusFilter>
> = [
  { value: "attached", label: "연결됨" },
  { value: "unattached", label: "미연결" },
];

export { ATTACHED_FILTER_OPTIONS };
