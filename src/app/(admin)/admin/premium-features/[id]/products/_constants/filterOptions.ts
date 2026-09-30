import type { FeatureProductBindingStatusFilter } from "@/core/domain/premium-feature";
import type { AllOptionSelectOption } from "@/ui/components/molecules/AllOptionSelect/AllOptionSelect";

const ATTACHED_FILTER_OPTIONS: ReadonlyArray<
  AllOptionSelectOption<FeatureProductBindingStatusFilter>
> = [
  { value: "attached", label: "연결됨" },
  { value: "unattached", label: "미연결" },
];

export { ATTACHED_FILTER_OPTIONS };
