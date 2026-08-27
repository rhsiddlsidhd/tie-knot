"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TypographyH1,
  TypographyMuted,
} from "@/ui/components/atoms";
import { CursorPagination } from "@/ui/components/molecules";
import type { AdminOrderListPage, OrderStatus } from "@/core/domain";
import { ORDER_STATUS_BADGE_VARIANTS, ORDER_STATUS_LABELS } from "@/core/domain";
import { formatKstDate } from "@/core/utils";

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

const AdminOrdersTemplate = ({ page, status, cursor }: AdminOrdersTemplateProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleStatusChange = (value: OrderStatus | "ALL") => {
    const query = value === "ALL" ? "" : `?status=${value}`;
    router.push(`${pathname}${query}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <TypographyH1 className="text-left text-3xl font-bold">
          주문 관리
        </TypographyH1>

        <Select value={status ?? "ALL"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">주문번호</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">고객명</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">상품</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">상태</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">금액</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">주문일</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {page.items.map((order) => (
                <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm">{order.merchantUid}</td>
                  <td className="px-4 py-3 text-sm">{order.buyerName}</td>
                  <td className="px-4 py-3 text-sm">{order.productTitle}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ORDER_STATUS_BADGE_VARIANTS[order.orderStatus]}>
                      {ORDER_STATUS_LABELS[order.orderStatus]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold">
                    {order.finalPrice.toLocaleString()}원
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatKstDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {page.items.length === 0 && (
          <div className="flex flex-col items-center gap-1 py-16 text-center">
            <p className="text-sm font-medium">조건에 해당하는 주문이 없습니다</p>
            <TypographyMuted>다른 상태 필터를 선택해보세요.</TypographyMuted>
          </div>
        )}
      </div>

      <CursorPagination
        basePath={pathname}
        query={status ? { status } : {}}
        hasCursor={!!cursor}
        nextCursor={page.nextCursor}
      />
    </div>
  );
};

export { AdminOrdersTemplate };
