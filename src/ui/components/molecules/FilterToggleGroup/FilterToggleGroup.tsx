import { ToggleGroup, ToggleGroupItem } from "@/ui/components/ui/toggle-group";

// ToggleGroup은 string 값만 다룬다 — null 옵션("전체" 등)을 이 값으로 바꿔 넘긴다.
const NULL_OPTION_VALUE = "__null__";

interface FilterToggleGroupOption<V extends string> {
  value: V | null;
  label: string;
}

interface FilterToggleGroupProps<V extends string> {
  label: string;
  options: readonly FilterToggleGroupOption<V>[];
  value: V | null;
  onValueChange: (value: V | null) => void;
}

const toItemValue = (value: string | null) => value ?? NULL_OPTION_VALUE;

const FilterToggleGroup = <V extends string>({
  label,
  options,
  value,
  onValueChange,
}: FilterToggleGroupProps<V>) => (
  <ToggleGroup
    type="single"
    variant="outline"
    size="sm"
    spacing={2}
    aria-label={label}
    className="flex-wrap"
    value={toItemValue(value)}
    onValueChange={(nextValue) => {
      // 선택된 항목을 다시 누르면 ""가 온다 — 항상 하나가 선택된 상태로 둔다.
      const option = options.find(
        (candidate) => toItemValue(candidate.value) === nextValue,
      );
      if (option) onValueChange(option.value);
    }}
  >
    {options.map((option) => (
      <ToggleGroupItem
        key={toItemValue(option.value)}
        value={toItemValue(option.value)}
      >
        {option.label}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
);

export { FilterToggleGroup };
export type { FilterToggleGroupOption, FilterToggleGroupProps };
