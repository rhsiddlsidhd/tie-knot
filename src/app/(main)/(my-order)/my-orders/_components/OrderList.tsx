"use client";

import Link from "next/link";
import useSWRInfinite from "swr/infinite";
import { Inbox } from "lucide-react";
import {
  Button,
  TypographyH3,
  TypographyMuted,
} from "@/ui/components/atoms";
import { fetcher } from "@/ui/fetcher";
import type {
  ErrorPayload,
  OrderListPage,
  OrderStatus,
  ProductCategory,
} from "@/core/domain";
import { routes, MOBILE_INVITATION_CATEGORY } from "@/core/domain";
import { OrderCard } from "./OrderCard";

interface OrderListProps {
  firstPage: OrderListPage;
  status?: OrderStatus;
  category?: ProductCategory;
}

const buildKey = ({
  status,
  category,
  cursor,
}: {
  status?: OrderStatus;
  category?: ProductCategory;
  cursor?: string;
}) => {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (category) params.set("category", category);
  if (cursor) params.set("cursor", cursor);

  const query = params.toString();
  return query ? `/api/order?${query}` : "/api/order";
};

/**
 * 첫 페이지는 Server Component가 이미 렌더한 결과를 fallbackData로 받고, 더보기부터만
 * route handler를 탄다. SWR key에 status/category가 들어 있어 필터가 바뀌면 누적분이
 * 자동으로 리셋된다.
 */
const OrderList = ({ firstPage, status, category }: OrderListProps) => {
  const { data, error, size, setSize, isValidating, mutate } =
    useSWRInfinite<OrderListPage>(
      (pageIndex, previousPage: OrderListPage | null) => {
        if (pageIndex === 0) return buildKey({ status, category });
        if (!previousPage?.nextCursor) return null;
        return buildKey({ status, category, cursor: previousPage.nextCursor });
      },
      fetcher,
      {
        fallbackData: [firstPage],
        revalidateFirstPage: false,
        // 첫 페이지는 방금 Server Component가 조회해 넘겨준 값이다 — 마운트 시
        // 같은 쿼리를 한 번 더 돌리지 않는다. 갱신이 필요한 시점(취소 등)에는
        // mutate로 명시적으로 다시 받아온다.
        revalidateOnMount: false,
      },
    );

  const pages = data ?? [firstPage];
  const orders = pages.flatMap((page) => page.items);
  const hasMore = Boolean(pages.at(-1)?.nextCursor);
  const isFiltered = Boolean(status || category);

  if (orders.length === 0) {
    return (
      <div className="border-border flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
        <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
          <Inbox className="text-muted-foreground h-8 w-8" />
        </div>
        {isFiltered ? (
          <>
            <TypographyH3 className="mt-4 text-xl font-semibold">
              조건에 맞는 주문이 없습니다.
            </TypographyH3>
            <TypographyMuted className="mt-2">
              다른 상태나 카테고리를 선택해보세요.
            </TypographyMuted>
            <Button asChild className="mt-6" variant="outline">
              <Link href={routes.myOrders.root}>필터 초기화</Link>
            </Button>
          </>
        ) : (
          <>
            <TypographyH3 className="mt-4 text-xl font-semibold">
              주문 내역이 없습니다.
            </TypographyH3>
            <TypographyMuted className="mt-2">
              아직 주문한 상품이 없어요. 상품을 구경하고 첫 주문을 해보세요.
            </TypographyMuted>
            <Button asChild className="mt-6">
              <Link href={routes.products.byCategory(MOBILE_INVITATION_CATEGORY)}>
                청첩장 보러가기
              </Link>
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order._id}
          order={order}
          onOrderChanged={() => mutate()}
        />
      ))}

      {error && (
        <TypographyMuted className="text-destructive text-center">
          {(error as ErrorPayload).message}
        </TypographyMuted>
      )}

      {hasMore && (
        <Button
          className="w-full"
          variant="outline"
          disabled={isValidating}
          onClick={() => setSize(size + 1)}
        >
          {isValidating ? "불러오는 중..." : "더보기"}
        </Button>
      )}
    </div>
  );
};

export { OrderList };
