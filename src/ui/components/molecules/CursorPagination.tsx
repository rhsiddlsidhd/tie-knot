import Link from "next/link";
import { Button } from "@/ui/components/atoms";

interface CursorPaginationProps {
  /** 현재 라우트 pathname — 도메인 의미 없이 그대로 링크 생성에 쓴다. */
  basePath: string;
  /** cursor를 뺀 현재 필터 query — 첫 페이지/다음 페이지 링크 모두 그대로 보존한다. */
  query?: Record<string, string>;
  /** 현재 페이지가 이미 cursor로 진입한 페이지인지(true면 "첫 페이지"를 활성화). */
  hasCursor: boolean;
  /** 다음 페이지 존재 여부 — null이면 마지막 페이지다. */
  nextCursor: string | null;
}

/**
 * 순수 [-]/[+] 페이지 이동 뷰 — status/role 같은 도메인 필터 의미나 MongoDB
 * cursor의 내부 구조를 모른다. 호출부(각 admin Template)가 현재 필터 query와
 * cursor 상태만 props로 넘긴다. 링크 이동이라 브라우저 뒤로 가기로 이전 cursor
 * 페이지가 그대로 복원된다.
 */
const CursorPagination = ({
  basePath,
  query = {},
  hasCursor,
  nextCursor,
}: CursorPaginationProps) => {
  const firstPageHref = { pathname: basePath, query };
  const nextPageHref = {
    pathname: basePath,
    query: nextCursor ? { ...query, cursor: nextCursor } : query,
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {hasCursor ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={firstPageHref}>첫 페이지</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          첫 페이지
        </Button>
      )}

      {nextCursor ? (
        <Button variant="outline" size="sm" asChild>
          <Link href={nextPageHref}>다음 페이지</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          다음 페이지
        </Button>
      )}
    </div>
  );
};

export { CursorPagination };
