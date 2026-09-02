"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/atoms/select";
import { Tabs, TabsList, TabsTrigger } from "@/ui/components/atoms/tabs";
import type { OrderStatus } from "@/core/domain/order";
import type { ProductCategory } from "@/core/domain/product-category";
import { ORDER_STATUSES } from "@/core/domain/order";
import { PRODUCT_CATEGORIES, productCategoryLabels } from "@/core/domain/product-category";
import { routes } from "@/core/domain/routes";
import { ORDER_STATUS_TAB_LABELS, resolveOrderStatusLabel } from "@/app/(main)/(my-order)/my-orders/_constants/labels";

const ALL_VALUE = "ALL";

interface OrderFiltersProps {
  status?: OrderStatus;
  category?: ProductCategory;
}

/**
 * 필터 상태는 URL searchParams가 소유한다 — 선택이 바뀌면 router.push로 URL을 갱신해
 * Server Component가 1페이지를 다시 렌더하고, 목록의 더보기 누적분도 함께 리셋된다.
 */
const OrderFilters = ({ status, category }: OrderFiltersProps) => {
  const router = useRouter();

  const pushFilters = (next: {
    status?: OrderStatus;
    category?: ProductCategory;
  }) => {
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if (next.category) params.set("category", next.category);

    const query = params.toString();
    router.push(query ? `${routes.myOrders.root}?${query}` : routes.myOrders.root);
  };

  // 카테고리를 하나로 좁혔으면 그 카테고리의 구체어를, "전체"면 중립어를 쓴다.
  const statusLabel = (value: OrderStatus) =>
    category
      ? resolveOrderStatusLabel(value, category)
      : ORDER_STATUS_TAB_LABELS[value];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs
        value={status ?? ALL_VALUE}
        onValueChange={(value) =>
          pushFilters({
            status: value === ALL_VALUE ? undefined : (value as OrderStatus),
            category,
          })
        }
      >
        <TabsList>
          <TabsTrigger value={ALL_VALUE}>전체</TabsTrigger>
          {ORDER_STATUSES.map((value) => (
            <TabsTrigger key={value} value={value}>
              {statusLabel(value)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Select
        value={category ?? ALL_VALUE}
        onValueChange={(value) =>
          pushFilters({
            status,
            category:
              value === ALL_VALUE ? undefined : (value as ProductCategory),
          })
        }
      >
        <SelectTrigger className="w-40" aria-label="카테고리 필터">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>전체 카테고리</SelectItem>
          {PRODUCT_CATEGORIES.map((value) => (
            <SelectItem key={value} value={value}>
              {productCategoryLabels[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export { OrderFilters };
