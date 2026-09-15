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
  /**
   * 필터를 바꿔도 유지할 다른 파라미터(검색어 등). `cursor`는 넘겨도 무시한다 —
   * 필터가 바뀌면 이전 페이지 위치는 의미가 없다.
   */
  preserved?: Record<string, string | undefined>;
}

const QueryFilterSelect = <T extends string>({
  basePath,
  paramName,
  value,
  options,
  preserved = {},
}: QueryFilterSelectProps<T>) => {
  const router = useRouter();

  const handleChange = (next: T | "ALL") => {
    const params = new URLSearchParams();
    Object.entries(preserved).forEach(([key, entry]) => {
      if (key !== "cursor" && entry !== undefined) params.set(key, entry);
    });
    if (next !== "ALL") params.set(paramName, next);

    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
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
