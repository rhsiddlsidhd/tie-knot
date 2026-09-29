import type { AdminProductSortKey } from "@/core/domain/product";
import type { DataTableColumn } from "@/ui/components/organisms/DataTable/DataTable";

type Column = DataTableColumn<AdminProductSortKey>;

const ACTIVE_PRODUCT_TABLE_COLUMNS: readonly Column[] = [
  { label: "썸네일", sort: null },
  { label: "상품명", sort: "title" },
  { label: "카테고리", sort: null },
  { label: "가격", sort: "price" },
  { label: "타입", sort: null },
  { label: "상태", sort: null },
  { label: "조회수", sort: "views" },
  { label: "좋아요", sort: "likesCount" },
  { label: "판매량", sort: "salesCount" },
  { label: "우선순위", sort: "priority" },
  { label: "등록일", sort: "createdAt" },
  { label: "관리", sort: null },
];

// 휴지통은 상태가 항상 "삭제됨"이라 상태 열 자리를 삭제일 정렬로 쓴다.
const TRASH_PRODUCT_TABLE_COLUMNS: readonly Column[] = [
  { label: "썸네일", sort: null },
  { label: "상품명", sort: "title" },
  { label: "카테고리", sort: null },
  { label: "가격", sort: "price" },
  { label: "타입", sort: null },
  { label: "삭제일", sort: "deletedAt" },
  { label: "조회수", sort: "views" },
  { label: "좋아요", sort: "likesCount" },
  { label: "판매량", sort: "salesCount" },
  { label: "우선순위", sort: "priority" },
  { label: "등록일", sort: "createdAt" },
  { label: "관리", sort: null },
];

export { ACTIVE_PRODUCT_TABLE_COLUMNS, TRASH_PRODUCT_TABLE_COLUMNS };
