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
  const syncingExternalValue = useRef(true);
  const debouncedValue = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    syncingExternalValue.current = true;
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (syncingExternalValue.current) {
      if (debouncedValue === value) syncingExternalValue.current = false;
      return;
    }

    const nextValue = debouncedValue.trim();
    if (nextValue !== value) onSearch(nextValue);
  }, [debouncedValue, onSearch, value]);

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        type="search"
        value={inputValue}
        placeholder={placeholder}
        onChange={(event) => {
          syncingExternalValue.current = false;
          setInputValue(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault();
        }}
      />
    </div>
  );
};

export { SearchInputBar };
export type { SearchInputBarProps };
