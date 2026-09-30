"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import { useDebouncedValue } from "@/ui/hooks/useDebouncedValue";

interface SearchInputBarProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  label: string;
}

const SEARCH_DEBOUNCE_MS = 300;

const SearchInputBar = ({
  value,
  onSearch,
  placeholder,
  label,
}: SearchInputBarProps) => {
  const inputId = useId();
  const [inputValue, setInputValue] = useState(value);
  const lastSearchValue = useRef(value);
  const onSearchRef = useRef(onSearch);
  const debouncedValue = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS);

  // onSearch는 URL이 바뀔 때마다 새 함수로 올 수 있다 — effect 의존성에 두면
  // debounce가 아직 들고 있는 이전 값으로 검색이 다시 실행된다.
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    const nextValue = debouncedValue.trim();
    if (nextValue === lastSearchValue.current) return;

    lastSearchValue.current = nextValue;
    onSearchRef.current(nextValue);
  }, [debouncedValue]);

  useEffect(() => {
    if (value === lastSearchValue.current) return;

    lastSearchValue.current = value;
    setInputValue(value);
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        type="search"
        value={inputValue}
        placeholder={placeholder}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault();
        }}
      />
    </div>
  );
};

export { SearchInputBar };
export type { SearchInputBarProps };
