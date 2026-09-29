import type { AdminReviewSortKey } from "@/core/domain/review";
import type { DataTableColumn } from "@/ui/components/organisms/DataTable/DataTable";

const REVIEW_TABLE_COLUMNS = [
  { label: "상품" },
  { label: "작성자" },
  { label: "평점", sort: "rating" },
  { label: "내용" },
  { label: "작성일", sort: "createdAt" },
  { label: "관리" },
] as const satisfies readonly DataTableColumn<AdminReviewSortKey>[];

export { REVIEW_TABLE_COLUMNS };
