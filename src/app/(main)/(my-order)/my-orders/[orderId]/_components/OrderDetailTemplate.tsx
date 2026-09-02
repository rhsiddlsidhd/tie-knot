import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/ui/components/atoms/badge";
import { Button } from "@/ui/components/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/atoms/card";
import { TypographyH1, TypographyMuted } from "@/ui/components/atoms/typography";
import { ChevronLeft } from "lucide-react";
import type { OrderDetail } from "@/core/domain/order";
import { routes } from "@/core/domain/routes";
import { PAY_METHOD_LABEL, resolveOrderStatusLabel } from "@/app/(main)/(my-order)/my-orders/_constants/labels";

const formatDateTime = (value: Date | string) =>
  format(new Date(value), "yyyy.MM.dd HH:mm");

const PAY_STATUS_LABELS: Record<string, string> = {
  PENDING: "입금대기",
  PAID: "결제완료",
  FAILED: "결제실패",
  CANCELLED: "결제취소",
  PARTIAL_CANCELLED: "부분취소",
  REFUNDED: "환불완료",
};

const OrderDetailTemplate = ({ order, payment }: OrderDetail) => {
  const product = order.product;
  const optionsTotal = product.selectedFeatures.reduce(
    (sum, feature) => sum + feature.price,
    0,
  );

  // 실제로 도달한 이벤트만 넣는다 — 아직 안 일어난 단계는 아예 표시하지 않으므로
  // (미래 예정 단계를 회색 점으로 미리 보여주는 UI가 아니다), 여기 들어온 항목은
  // 전부 "완료됨" 취급해 점을 항상 primary로 채운다.
  const timelineEvents = [
    { label: "주문 생성", value: formatDateTime(order.createdAt) },
    order.confirmedAt && { label: "결제 완료", value: formatDateTime(order.confirmedAt) },
    order.invitationStatus === "published" && { label: "청첩장 발행", value: "완료" },
    order.cancelledAt && {
      label: "주문 취소",
      value: `${formatDateTime(order.cancelledAt)}${order.cancelReason ? ` · ${order.cancelReason}` : ""}`,
    },
  ].filter((event): event is { label: string; value: string } => Boolean(event));

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={routes.myOrders.root}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            주문 목록
          </Link>
        </Button>
        <TypographyH1 className="text-left text-3xl font-bold">
          주문 상세
        </TypographyH1>
        <div className="flex items-center gap-3">
          <Badge>{resolveOrderStatusLabel(order.orderStatus, product.category)}</Badge>
          <TypographyMuted>{order.merchantUid}</TypographyMuted>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">구매 옵션 내역</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>
              {product.title} × {product.quantity}
            </span>
            <span>
              {(product.pricing.discountedPrice * product.quantity).toLocaleString()}원
            </span>
          </div>
          {product.selectedFeatures.map((feature) => (
            <div
              key={feature.featureId}
              className="text-muted-foreground flex justify-between text-sm"
            >
              <span>{feature.label}</span>
              <span>{feature.price.toLocaleString()}원</span>
            </div>
          ))}
          {product.selectedFeatures.length > 0 && (
            <div className="text-muted-foreground flex justify-between text-sm">
              <span>옵션 합계</span>
              <span>{optionsTotal.toLocaleString()}원</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>최종 결제금액</span>
            <span>{order.finalPrice.toLocaleString()}원</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">결제 내역</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>결제 수단</span>
            <span>{PAY_METHOD_LABEL[order.payMethod]}</span>
          </div>
          {payment ? (
            <>
              <div className="flex justify-between">
                <span>결제 상태</span>
                <span>{PAY_STATUS_LABELS[payment.status] ?? payment.status}</span>
              </div>
              <div className="flex justify-between">
                <span>결제 요청금액</span>
                <span>{payment.requestAmount.toLocaleString()}원</span>
              </div>
              {payment.paidAmount !== undefined && (
                <div className="flex justify-between">
                  <span>결제 금액</span>
                  <span>{payment.paidAmount.toLocaleString()}원</span>
                </div>
              )}
              {payment.paidAt && (
                <div className="flex justify-between">
                  <span>결제 일시</span>
                  <span>{formatDateTime(payment.paidAt)}</span>
                </div>
              )}
              {payment.virtualAccount && (
                <div className="flex justify-between">
                  <span>입금 계좌</span>
                  <span>
                    {payment.virtualAccount.bank ?? ""}{" "}
                    {payment.virtualAccount.accountNumber}
                  </span>
                </div>
              )}
              {payment.cancelledAt && (
                <div className="flex justify-between">
                  <span>결제 취소</span>
                  <span>
                    {formatDateTime(payment.cancelledAt)}
                    {payment.cancelAmount !== undefined &&
                      ` · ${payment.cancelAmount.toLocaleString()}원`}
                  </span>
                </div>
              )}
              {payment.failReason && (
                <div className="flex justify-between">
                  <span>실패 사유</span>
                  <span>{payment.failReason}</span>
                </div>
              )}
              {payment.receiptUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={payment.receiptUrl} target="_blank" rel="noreferrer">
                    영수증 보기
                  </a>
                </Button>
              )}
            </>
          ) : (
            <TypographyMuted>아직 결제가 진행되지 않은 주문입니다.</TypographyMuted>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">구매자 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>이름</span>
            <span>{order.buyerName}</span>
          </div>
          <div className="flex justify-between">
            <span>이메일</span>
            <span>{order.buyerEmail}</span>
          </div>
          <div className="flex justify-between">
            <span>연락처</span>
            <span>{order.buyerPhone}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">상태 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineEvents.map((event, index) => (
            <div key={event.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="bg-primary mt-1 h-2.5 w-2.5 shrink-0 rounded-full" />
                {index < timelineEvents.length - 1 && (
                  <span className="bg-border my-1 w-px flex-1" />
                )}
              </div>
              <div
                className={`flex flex-1 justify-between ${
                  index < timelineEvents.length - 1 ? "pb-4" : ""
                }`}
              >
                <span>{event.label}</span>
                <span className="text-muted-foreground text-sm">{event.value}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export { OrderDetailTemplate };
