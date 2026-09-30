import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/ui/select";

// Select는 string 값만 다룬다 — null 옵션("전체" 등)을 이 값으로 바꿔 넘긴다.
const NULL_OPTION_VALUE = "__null__";

interface AllOptionSelectOption<V extends string> {
  value: V | null;
  label: string;
}

interface AllOptionSelectProps<V extends string> {
  label: string;
  options: readonly AllOptionSelectOption<V>[];
  value: V | null;
  onValueChange: (value: V | null) => void;
}

const toItemValue = (value: string | null) => value ?? NULL_OPTION_VALUE;

const AllOptionSelect = <V extends string>({
  label,
  options,
  value,
  onValueChange,
}: AllOptionSelectProps<V>) => (
  <Select
    value={toItemValue(value)}
    onValueChange={(nextValue) => {
      const option = options.find(
        (candidate) => toItemValue(candidate.value) === nextValue,
      );
      if (option) onValueChange(option.value);
    }}
  >
    <SelectTrigger aria-label={label} className="w-fit">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem
          key={toItemValue(option.value)}
          value={toItemValue(option.value)}
        >
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export { AllOptionSelect };
export type { AllOptionSelectOption, AllOptionSelectProps };
