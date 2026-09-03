"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { AppImage } from "@/ui/components/atoms/app-image";
import { Badge } from "@/ui/components/atoms/badge";
import { Button } from "@/ui/components/atoms/button";
import { Card, CardContent, CardHeader } from "@/ui/components/atoms/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/components/atoms/dropdown-menu";
import { TypographyH3, TypographyMuted } from "@/ui/components/atoms/typography";
import { Alert } from "@/ui/components/molecules/Alert";
import { ConfirmDialog } from "@/ui/components/molecules/ConfirmDialog";
import { useCopy } from "@/ui/hooks/useCopy";
import { CreditCard, Edit, EllipsisVertical, Link2 } from "lucide-react";
import type { OrderListItem, OrderStatus } from "@/core/domain/order";
import { CUSTOMER_INPUT_ROUTES } from "@/core/domain/product-category";
import { routes } from "@/core/domain/routes";
import { cancelOrder } from "@/actions/cancelOrder";
import { PAY_METHOD_LABEL } from "@/app/(main)/(my-order)/my-orders/_constants/labels";
import { resolveOrderStatusLabel } from "@/app/(main)/(my-order)/my-orders/_utils/orderStatusLabel";
import { getInvitationInputDaysLeft } from "@/app/(main)/(my-order)/my-orders/_utils/orderDeadline";
import { PaymentButton } from "./PaymentButton";
import { PendingCoupleInfoBanner } from "../_components/PendingCoupleInfoBanner";
import { ReviewFormDialog } from "./ReviewFormDialog";

const STATUS_BADGE_VARIANTS: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

interface OrderCardProps {
  order: OrderListItem;
  // 취소가 성공하면 목록 캐시를 다시 받아와야 한다 — 목록을 소유한 쪽이 그 방법을 안다.
  onOrderChanged?: () => void;
}

const OrderCard = ({ order, onOrderChanged }: OrderCardProps) => {
  const router = useRouter();
  const [isCancelling, startCancelling] = useTransition();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  // 확인창을 연 DropdownMenuItem은 메뉴가 닫히며 사라진다 — 닫힐 때 포커스를
  // 되돌릴 대상은 그 메뉴를 여는 버튼이다.
  const orderMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const { copyToClipboard } = useCopy();

  const product = order.product;
  const hasDiscount = order.discountRate > 0 || order.discountAmount > 0;
  const customerInputRoute = product.category
    ? CUSTOMER_INPUT_ROUTES[product.category]?.(order._id)
    : undefined;
  // 결제는 완료됐지만 청첩장 콘텐츠를 아직 입력하지 않은 주문.
  const needsCustomerInput =
    order.orderStatus === "CONFIRMED" &&
    !order.invitationStatus &&
    customerInputRoute;

  // 같은 PENDING이라도 성격이 정반대다 — 가상계좌 주문은 입금을 기다리는 정상 주문이고,
  // 나머지는 결제창을 벗어난 채 방치된 주문이다. paymentId는 syncPayment가 발급을
  // 확인한 뒤에 붙으므로 그 전 구간은 결제수단으로 판별한다.
  const isVirtualAccount =
    Boolean(order.paymentId) || order.payMethod === "VIRTUAL_ACCOUNT";
  const isAwaitingDeposit =
    order.orderStatus === "PENDING" && isVirtualAccount;
  const isAbandonedPending =
    order.orderStatus === "PENDING" && !isVirtualAccount;

  const statusLabel = isAwaitingDeposit
    ? "입금대기"
    : resolveOrderStatusLabel(order.orderStatus, product.category);

  const handleCancel = () => {
    startCancelling(async () => {
      const result = await cancelOrder(order._id);
      if (result.success === false) {
        // 실패하면 확인창을 열어둔 채 재시도할 수 있게 남긴다.
        toast.error(result.error.message);
        return;
      }
      toast.success("주문이 취소되었습니다.");
      setIsCancelDialogOpen(false);
      // 화면에 그려지는 건 SWR 캐시라 RSC만 새로 그려서는 반영되지 않는다.
      onOrderChanged?.();
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Badge variant={STATUS_BADGE_VARIANTS[order.orderStatus]}>
            {statusLabel}
          </Badge>
          <TypographyMuted className="truncate">
            {order.merchantUid}
          </TypographyMuted>
          <TypographyMuted>
            {format(new Date(order.createdAt), "yyyy.MM.dd HH:mm")}
          </TypographyMuted>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              ref={orderMenuTriggerRef}
              size="sm"
              variant="ghost"
              aria-label="주문 메뉴"
            >
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => copyToClipboard(order.merchantUid)}
            >
              주문번호 복사
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={routes.myOrders.detail(order._id)}>상세보기</Link>
            </DropdownMenuItem>
            {isAbandonedPending && (
              <DropdownMenuItem
                disabled={isCancelling}
                onSelect={() => setIsCancelDialogOpen(true)}
              >
                주문 취소
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <ConfirmDialog
          open={isCancelDialogOpen}
          onOpenChange={setIsCancelDialogOpen}
          title="주문 취소"
          description={`"${product.title}" 주문을 취소합니다. 취소한 주문은 복구할 수 없습니다.`}
          confirmLabel="주문 취소"
          pendingLabel="취소 중..."
          pending={isCancelling}
          onConfirm={handleCancel}
          restoreFocusRef={orderMenuTriggerRef}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
              <AppImage
                src={product.thumbnail ?? "#"}
                alt={product.title}
                sizes="128px"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <TypographyH3 className="text-foreground text-base font-semibold">
                {product.title}
              </TypographyH3>
              {hasDiscount && (
                <div className="text-destructive text-xs">
                  {order.discountRate > 0 &&
                    `${Math.round(order.discountRate * 100)}% 할인`}
                  {order.discountAmount > 0 &&
                    ` -${order.discountAmount.toLocaleString()}원`}
                </div>
              )}
              <TypographyMuted>
                {order.finalPrice.toLocaleString()}원 {product.quantity}개
              </TypographyMuted>
              <TypographyMuted className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {PAY_METHOD_LABEL[order.payMethod]}
              </TypographyMuted>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            {order.orderStatus === "COMPLETED" && (
              <ReviewFormDialog
                key={order.review?.id ?? "new"}
                orderId={order._id}
                review={order.review}
              />
            )}
            {isAbandonedPending && <PaymentButton order={order} />}
            {order.invitationStatus &&
              order.orderStatus !== "CANCELLED" &&
              customerInputRoute && (
                <Button size="lg" variant="outline" asChild>
                  <Link href={customerInputRoute}>
                    <Edit className="mr-1 h-4 w-4" />
                    수정하기
                  </Link>
                </Button>
              )}
            {order.invitationPublicKey && (
              <Button
                size="lg"
                variant="outline"
                onClick={() =>
                  copyToClipboard(
                    `${window.location.origin}${routes.preview.detail(order.invitationPublicKey!)}`,
                  )
                }
              >
                <Link2 className="mr-1 h-4 w-4" />
                공개 링크 복사
              </Button>
            )}
          </div>
        </div>

        {isAwaitingDeposit && order.virtualAccount && (
          // Alert는 children을 <p>로 감싸므로 블록 요소를 중첩하지 않는다 —
          // <p> 안의 <div>는 SSR 하이드레이션 불일치를 만든다.
          <Alert type="warning">
            <span className="block font-semibold">입금 대기 중입니다.</span>
            <span className="block">
              {order.virtualAccount.bank ?? "가상계좌"}{" "}
              {order.virtualAccount.accountNumber}
              {order.virtualAccount.remitteeName &&
                ` (예금주 ${order.virtualAccount.remitteeName})`}
            </span>
            <span className="block">
              입금액 {order.finalPrice.toLocaleString()}원
            </span>
            {order.virtualAccount.expiredAt && (
              <span className="block">
                입금기한{" "}
                {format(
                  new Date(order.virtualAccount.expiredAt),
                  "yyyy.MM.dd HH:mm",
                )}
              </span>
            )}
          </Alert>
        )}

        {needsCustomerInput && (
          <PendingCoupleInfoBanner
            orderId={order._id}
            daysLeft={
              order.confirmedAt
                ? getInvitationInputDaysLeft(order.confirmedAt)
                : undefined
            }
          />
        )}

        {order.orderStatus === "CANCELLED" && (
          <TypographyMuted>
            {order.cancelledAt &&
              `${format(new Date(order.cancelledAt), "yyyy.MM.dd HH:mm")} 취소`}
            {order.cancelReason && ` · ${order.cancelReason}`}
          </TypographyMuted>
        )}
      </CardContent>
    </Card>
  );
};

export { OrderCard };
