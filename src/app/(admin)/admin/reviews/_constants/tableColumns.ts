import type { AdminReviewSortKey } from "@/core/domain/review";
import type { DataTableColumn } from "@/ui/components/organisms/DataTable/DataTable";

type Column = DataTableColumn<AdminReviewSortKey>;

const REVIEW_TABLE_COLUMNS: readonly Column[] = [
  { label: "상품", sort: null },
  { label: "작성자", sort: null },
  { label: "평점", sort: "rating" },
  { label: "내용", sort: null },
  { label: "작성일", sort: "createdAt" },
  { label: "관리", sort: null },
];

export { REVIEW_TABLE_COLUMNS };
