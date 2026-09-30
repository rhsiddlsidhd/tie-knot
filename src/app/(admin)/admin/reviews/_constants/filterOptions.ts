import type { AllOptionSelectOption } from "@/ui/components/molecules/AllOptionSelect/AllOptionSelect";

// URL/서버는 "1"~"5" 문자열로 주고받는다 — 스키마(z.coerce.number)가 숫자로 변환한다.
const RATING_FILTER_VALUES = ["1", "2", "3", "4", "5"] as const;

type RatingFilterValue = (typeof RATING_FILTER_VALUES)[number];

const RATING_FILTER_OPTIONS: ReadonlyArray<
  AllOptionSelectOption<RatingFilterValue>
> = [
  { value: "1", label: "★1" },
  { value: "2", label: "★2" },
  { value: "3", label: "★3" },
  { value: "4", label: "★4" },
  { value: "5", label: "★5" },
];

export { RATING_FILTER_VALUES, RATING_FILTER_OPTIONS };
