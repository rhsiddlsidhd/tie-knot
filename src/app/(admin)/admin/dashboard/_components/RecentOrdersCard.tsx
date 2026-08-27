import Link from "next/link";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TypographyMuted,
} from "@/ui/components/atoms";
import type { DashboardRecentOrder } from "@/core/domain";
import {
  ORDER_STATUS_BADGE_VARIANTS,
  ORDER_STATUS_LABELS,
  routes,
} from "@/core/domain";
import { formatPriceWithComma, formatRelativeTime } from "@/core/utils";

interface RecentOrdersCardProps {
  orders: DashboardRecentOrder[];
}

const RecentOrdersCard = ({ orders }: RecentOrdersCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>최근 주문</CardTitle>
        <Link
          href={routes.admin.orders}
          className="text-muted-foreground text-sm hover:underline"
        >
          전체 보기
        </Link>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-12 text-center">
            <p className="text-sm font-medium">아직 주문이 없습니다</p>
            <TypographyMuted>
              첫 주문이 들어오면 여기에 표시됩니다.
            </TypographyMuted>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    주문번호
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    고객명
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    상품
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    상태
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    금액
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    시간
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr
                    key={order.merchantUid}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">{order.merchantUid}</td>
                    <td className="px-4 py-3 text-sm">{order.buyerName}</td>
                    <td className="max-w-[16rem] truncate px-4 py-3 text-sm">
                      {order.productTitle}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.orderStatus]}>
                        {ORDER_STATUS_LABELS[order.orderStatus]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold">
                      {formatPriceWithComma(order.finalPrice)}원
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-right text-sm">
                      {formatRelativeTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { RecentOrdersCard };
