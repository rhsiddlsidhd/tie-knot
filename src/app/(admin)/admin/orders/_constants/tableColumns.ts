import type { AdminOrderSortKey } from "@/core/domain/order";
import type { DataTableColumn } from "@/ui/components/organisms/DataTable/DataTable";

type Column = DataTableColumn<AdminOrderSortKey>;

const ORDER_TABLE_COLUMNS: readonly Column[] = [
  { label: "주문번호", sort: null },
  { label: "고객명", sort: null },
  { label: "상품", sort: null },
  { label: "상태", sort: null },
  { label: "금액", sort: "finalPrice" },
  { label: "주문일", sort: "createdAt" },
];

export { ORDER_TABLE_COLUMNS };
