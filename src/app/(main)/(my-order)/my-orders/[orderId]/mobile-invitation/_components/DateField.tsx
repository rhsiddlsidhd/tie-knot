"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/ui/components/atoms/button";
import { Calendar } from "@/ui/components/atoms/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/components/atoms/popover";
import { Input } from "@/ui/components/atoms/input";

import { FieldFrame } from "@/ui/components/organisms/FieldFrame";
import type { FieldBase } from "@/core/domain/field";
import { cn } from "@/core/utils/cn";

interface DateFieldProps extends Omit<FieldBase, "defaultValue"> {
  defaultValue?: Date;
  placeholder?: string;
  required?: boolean;
}

const DateField = ({
  id,
  name,
  children,
  defaultValue,
  required = false,
  placeholder = "날짜를 선택하세요",
}: DateFieldProps) => {
  const [date, setDate] = useState<Date | undefined>(defaultValue);
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);

  // defaultValue 변경 시 state 업데이트 (data 로딩 후 반영)
  if (defaultValue !== prevDefaultValue) {
    setPrevDefaultValue(defaultValue);
    setDate(defaultValue);
  }

  return (
    <FieldFrame id={id} label={children}>
      {/* 폼 제출을 위한 hidden input */}
      <Input
        type="hidden"
        name={name}
        value={date ? format(date, "yyyy-MM-dd") : ""}
        required={required}
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: ko }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              if (newDate) setDate(newDate);
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </FieldFrame>
  );
};

export { DateField };
