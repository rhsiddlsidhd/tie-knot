import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/ui/select";

const ALL_OPTION_VALUE = "__all__";
const OPTION_VALUE_PREFIX = "__option__:";

interface AllOptionSelectOption<V extends string> {
  value: V;
  label: string;
}

interface AllOptionSelectProps<V extends string> {
  label: string;
  allLabel: string;
  options: readonly AllOptionSelectOption<V>[];
  value: V | null;
  onValueChange: (value: V | null) => void;
}

const encodeOptionValue = (value: string) => `${OPTION_VALUE_PREFIX}${value}`;

const AllOptionSelect = <V extends string>({
  label,
  allLabel,
  options,
  value,
  onValueChange,
}: AllOptionSelectProps<V>) => (
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
    <SelectTrigger aria-label={label} className="w-fit">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem key={allLabel} value={ALL_OPTION_VALUE}>
        {allLabel}
      </SelectItem>
      {options.map((option) => (
        <SelectItem key={option.label} value={encodeOptionValue(option.value)}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export { AllOptionSelect };
export type { AllOptionSelectOption, AllOptionSelectProps };
