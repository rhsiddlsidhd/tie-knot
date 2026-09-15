import Link from "next/link";
import { Badge } from "@/ui/components/atoms/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/components/atoms/card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/ui/components/atoms/empty";
import { TableRow, TableCell } from "@/ui/components/atoms/table";
import { TableShell } from "@/ui/components/molecules/TableShell";
import type { DashboardRecentOrder } from "@/core/domain/dashboard";
import {
  ORDER_STATUS_BADGE_VARIANTS,
  ORDER_STATUS_LABELS,
} from "@/core/domain/order";
import { ROUTES } from "@/core/domain/routes";
import { formatPriceWithComma } from "@/core/utils/price";
import { formatRelativeTime } from "@/core/utils/date";

const TABLE_HEADINGS = ["주문번호", "고객명", "상품", "상태", "금액", "시간"];

interface RecentOrdersCardProps {
  orders: DashboardRecentOrder[];
}

const RecentOrdersCard = ({ orders }: RecentOrdersCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>최근 주문</CardTitle>
        <Link
          href={ROUTES.admin.orders}
          className="text-muted-foreground text-sm hover:underline"
        >
          전체 보기
        </Link>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>아직 주문이 없습니다</EmptyTitle>
              <EmptyDescription>
                첫 주문이 들어오면 여기에 표시됩니다.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <TableShell headings={TABLE_HEADINGS}>
            {orders.map((order) => (
              <TableRow key={order.merchantUid}>
                <TableCell>{order.merchantUid}</TableCell>
                <TableCell>{order.buyerName}</TableCell>
                <TableCell className="max-w-[16rem] truncate">
                  {order.productTitle}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={ORDER_STATUS_BADGE_VARIANTS[order.orderStatus]}
                  >
                    {ORDER_STATUS_LABELS[order.orderStatus]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatPriceWithComma(order.finalPrice)}원
                </TableCell>
                <TableCell className="text-muted-foreground text-right">
                  {formatRelativeTime(order.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableShell>
        )}
      </CardContent>
    </Card>
  );
};

export { RecentOrdersCard };
