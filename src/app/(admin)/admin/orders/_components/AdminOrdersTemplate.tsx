"use client";

import { useState } from "react";
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
import type { OrderStatus } from "@/core/domain";
import { ORDER_STATUS_BADGE_VARIANTS, ORDER_STATUS_LABELS } from "@/core/domain";
import { MOCK_ORDERS } from "../_constants";

const STATUS_FILTER_OPTIONS: Array<{ value: OrderStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "전체 상태" },
  { value: "PENDING", label: ORDER_STATUS_LABELS.PENDING },
  { value: "CONFIRMED", label: ORDER_STATUS_LABELS.CONFIRMED },
  { value: "COMPLETED", label: ORDER_STATUS_LABELS.COMPLETED },
  { value: "CANCELLED", label: ORDER_STATUS_LABELS.CANCELLED },
];

const AdminOrdersTemplate = () => {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");

  const orders =
    statusFilter === "ALL"
      ? MOCK_ORDERS
      : MOCK_ORDERS.filter((order) => order.orderStatus === statusFilter);

  return (
    <div className="space-y-6">
      <TypographyMuted>
        mock UI만 구현 — 실제 주문 전체조회 API는 아직 없습니다.
      </TypographyMuted>

      <div className="flex items-center justify-between">
        <TypographyH1 className="text-left text-3xl font-bold">
          주문 관리
        </TypographyH1>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as OrderStatus | "ALL")}
        >
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
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.merchantUid} className="hover:bg-muted/50 transition-colors">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="flex flex-col items-center gap-1 py-16 text-center">
            <p className="text-sm font-medium">조건에 해당하는 주문이 없습니다</p>
            <TypographyMuted>다른 상태 필터를 선택해보세요.</TypographyMuted>
          </div>
        )}
      </div>
    </div>
  );
};

export { AdminOrdersTemplate };
