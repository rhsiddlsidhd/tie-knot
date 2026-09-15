"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/atoms/select";

interface QueryFilterOption<T extends string> {
  value: T | "ALL";
  label: string;
}

interface QueryFilterSelectProps<T extends string> {
  basePath: string;
  paramName: string;
  value?: T;
  options: Array<QueryFilterOption<T>>;
}

const QueryFilterSelect = <T extends string>({
  basePath,
  paramName,
  value,
  options,
}: QueryFilterSelectProps<T>) => {
  const router = useRouter();

  const handleChange = (next: T | "ALL") => {
    const query = next === "ALL" ? "" : `?${paramName}=${next}`;
    router.push(`${basePath}${query}`);
  };

  return (
    <Select value={value ?? "ALL"} onValueChange={handleChange}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export { QueryFilterSelect };
