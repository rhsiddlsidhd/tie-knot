import { ToggleGroup, ToggleGroupItem } from "@/ui/components/ui/toggle-group";

interface FilterToggleGroupOption<V extends string> {
  value: V;
  label: string;
}

interface FilterToggleGroupProps<V extends string> {
  label: string;
  options: readonly FilterToggleGroupOption<V>[];
  value: V;
  onValueChange: (value: V) => void;
}

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
    value={value}
    onValueChange={(nextValue) => {
      // 선택된 항목을 다시 누르면 ""가 온다 — 항상 하나가 선택된 상태로 둔다.
      if (nextValue) onValueChange(nextValue as V);
    }}
  >
    {options.map((option) => (
      <ToggleGroupItem key={option.value} value={option.value}>
        {option.label}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
);

export { FilterToggleGroup };
export type { FilterToggleGroupOption, FilterToggleGroupProps };
