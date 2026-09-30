import { ChevronLeft, ChevronRight } from "lucide-react";

import { getPageRange } from "@/core/utils/page-range";
import { Button } from "@/ui/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/ui/components/ui/pagination";

interface OffsetPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

const OffsetPagination = ({
  page,
  totalPages,
  total,
  onPageChange,
}: OffsetPaginationProps) => {
  const pageRange = getPageRange(page, totalPages);

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-muted-foreground text-sm">총 {total}건</p>

      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                aria-label="이전 페이지"
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft aria-hidden="true" />
                이전
              </Button>
            </PaginationItem>

            {pageRange.map((item, index) => (
              <PaginationItem key={`${item}-${index}`}>
                {item === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <Button
                    type="button"
                    variant={item === page ? "outline" : "ghost"}
                    size="icon"
                    aria-label={`${item}페이지`}
                    aria-current={item === page ? "page" : undefined}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </Button>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                aria-label="다음 페이지"
                onClick={() => onPageChange(page + 1)}
              >
                다음
                <ChevronRight aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export { OffsetPagination };
export type { OffsetPaginationProps };
