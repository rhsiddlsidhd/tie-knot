import { Badge } from "@/ui/components/atoms/badge";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/ui/components/atoms/empty";
import { TableRow, TableCell } from "@/ui/components/atoms/table";
import { AdminListHeading } from "@/ui/components/molecules/AdminListHeading";
import { PaginatedTable } from "@/ui/components/organisms/PaginatedTable";
import { QueryFilterSelect } from "@/ui/components/organisms/QueryFilterSelect";
import type { AdminOrderListPage, OrderStatus } from "@/core/domain/order";
import { ORDER_STATUS_BADGE_VARIANTS, ORDER_STATUS_LABELS } from "@/core/domain/order";
import { formatKstDate } from "@/core/utils/date";
import { ROUTES } from "@/core/domain/routes";

const TABLE_HEADINGS = ["주문번호", "고객명", "상품", "상태", "금액", "주문일"];

const STATUS_FILTER_OPTIONS: Array<{ value: OrderStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "전체 상태" },
  { value: "PENDING", label: ORDER_STATUS_LABELS.PENDING },
  { value: "CONFIRMED", label: ORDER_STATUS_LABELS.CONFIRMED },
  { value: "COMPLETED", label: ORDER_STATUS_LABELS.COMPLETED },
  { value: "CANCELLED", label: ORDER_STATUS_LABELS.CANCELLED },
];

interface AdminOrdersTemplateProps {
  page: AdminOrderListPage;
  status?: OrderStatus;
  cursor?: string;
}

const AdminOrdersTemplate = ({ page, status, cursor }: AdminOrdersTemplateProps) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <AdminListHeading title="주문 관리" />
      <QueryFilterSelect
        basePath={ROUTES.admin.orders}
        paramName="status"
        value={status}
        options={STATUS_FILTER_OPTIONS}
      />
    </div>

    <PaginatedTable
      headings={TABLE_HEADINGS}
      basePath={ROUTES.admin.orders}
      query={status ? { status } : {}}
      hasCursor={!!cursor}
      nextCursor={page.nextCursor}
    >
      {page.items.length === 0 ? (
        <TableRow>
          <TableCell colSpan={TABLE_HEADINGS.length}>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>조건에 해당하는 주문이 없습니다</EmptyTitle>
                <EmptyDescription>
                  다른 상태 필터를 선택해보세요.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </TableCell>
        </TableRow>
      ) : (
        page.items.map((order) => (
          <TableRow key={order.id}>
            <TableCell>{order.merchantUid}</TableCell>
            <TableCell>{order.buyerName}</TableCell>
            <TableCell>{order.productTitle}</TableCell>
            <TableCell>
              <Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.orderStatus]}>
                {ORDER_STATUS_LABELS[order.orderStatus]}
              </Badge>
            </TableCell>
            <TableCell className="font-semibold">
              {order.finalPrice.toLocaleString()}원
            </TableCell>
            <TableCell>{formatKstDate(order.createdAt)}</TableCell>
          </TableRow>
        ))
      )}
    </PaginatedTable>
  </div>
);

export { AdminOrdersTemplate };
