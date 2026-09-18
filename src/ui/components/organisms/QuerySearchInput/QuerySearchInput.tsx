import { Search } from "lucide-react";

import { Button } from "@/ui/components/atoms/button";
import { Input } from "@/ui/components/atoms/input";
import { Label } from "@/ui/components/atoms/label";

interface QuerySearchInputProps {
  /** 현재 라우트 pathname — 폼이 그대로 제출되는 곳이다. */
  basePath: string;
  label: string;
  /** URL 파라미터 이름. 관리자 목록은 전부 `q`를 쓴다(#309). */
  paramName?: string;
  value?: string;
  placeholder?: string;
  /**
   * 검색과 함께 유지할 다른 필터. `cursor`는 넘겨도 무시한다 — 새 검색은 항상
   * 첫 페이지에서 시작해야 하고, 이전 페이지 위치를 새 결과에 적용하면 안 된다.
   */
  preserved?: Record<string, string | undefined>;
}

/**
 * URL이 소유하는 목록 검색 입력. GET 폼이라 제출하면 브라우저가 쿼리스트링을 만들고,
 * 뒤로 가기로 이전 검색 상태가 그대로 복원된다. 클라이언트 상태를 두지 않는다.
 */
const QuerySearchInput = ({
  basePath,
  label,
  paramName = "q",
  value,
  placeholder,
  preserved = {},
}: QuerySearchInputProps) => (
  <form action={basePath} method="get" className="flex items-end gap-2">
    {Object.entries(preserved)
      .filter(([key, entry]) => key !== "cursor" && entry !== undefined)
      .map(([key, entry]) => (
        <input key={key} type="hidden" name={key} value={entry} />
      ))}

    <div className="flex-1 space-y-2">
      <Label htmlFor={paramName}>{label}</Label>
      <Input
        id={paramName}
        name={paramName}
        type="search"
        defaultValue={value ?? ""}
        placeholder={placeholder}
      />
    </div>
    <Button type="submit" variant="outline">
      <Search className="mr-1 h-4 w-4" />
      검색
    </Button>
  </form>
);

export { QuerySearchInput };
