import type { AdminOrderSortKey } from "@/core/domain/order";
import type { DataTableColumn } from "@/ui/components/organisms/DataTable/DataTable";

const ORDER_TABLE_COLUMNS = [
  { label: "주문번호" },
  { label: "고객명" },
  { label: "상품" },
  { label: "상태" },
  { label: "금액", sort: "finalPrice" },
  { label: "주문일", sort: "createdAt" },
] as const satisfies readonly DataTableColumn<AdminOrderSortKey>[];

export { ORDER_TABLE_COLUMNS };
