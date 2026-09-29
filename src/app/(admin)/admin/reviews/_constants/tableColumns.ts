import type { AdminReviewSortKey } from "@/core/domain/review";
import type { DataTableColumn } from "@/ui/components/organisms/DataTable/DataTable";

const REVIEW_TABLE_COLUMNS = [
  { label: "상품", sort: null },
  { label: "작성자", sort: null },
  { label: "평점", sort: "rating" },
  { label: "내용", sort: null },
  { label: "작성일", sort: "createdAt" },
  { label: "관리", sort: null },
] as const satisfies readonly DataTableColumn<AdminReviewSortKey>[];

export { REVIEW_TABLE_COLUMNS };
