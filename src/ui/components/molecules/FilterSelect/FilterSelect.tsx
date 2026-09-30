import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/ui/select";

const ALL_OPTION_VALUE = "__all__";
const OPTION_VALUE_PREFIX = "__option__:";

interface FilterSelectOption<V extends string> {
  value: V;
  label: string;
}

interface FilterSelectProps<V extends string> {
  ariaLabel: string;
  allOptionLabel: string;
  options: readonly FilterSelectOption<V>[];
  value: V | null;
  onValueChange: (value: V | null) => void;
}

const encodeOptionValue = (value: string) => `${OPTION_VALUE_PREFIX}${value}`;

const FilterSelect = <V extends string>({
  ariaLabel,
  allOptionLabel,
  options,
  value,
  onValueChange,
}: FilterSelectProps<V>) => (
  <Select
    value={value === null ? ALL_OPTION_VALUE : encodeOptionValue(value)}
    onValueChange={(nextValue) => {
      if (nextValue === ALL_OPTION_VALUE) {
        onValueChange(null);
        return;
      }

      const option = options.find(
        (candidate) => encodeOptionValue(candidate.value) === nextValue,
      );
      if (option) onValueChange(option.value);
    }}
  >
    <SelectTrigger aria-label={ariaLabel} className="w-fit">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem key={allOptionLabel} value={ALL_OPTION_VALUE}>
        {allOptionLabel}
      </SelectItem>
      {options.map((option) => (
        <SelectItem key={option.label} value={encodeOptionValue(option.value)}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export { FilterSelect };
export type { FilterSelectOption, FilterSelectProps };
