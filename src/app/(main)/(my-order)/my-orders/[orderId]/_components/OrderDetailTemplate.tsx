import Link from "next/link";
import { format } from "date-fns";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TypographyH1,
  TypographyMuted,
} from "@/ui/components/atoms";
import { ChevronLeft } from "lucide-react";
import type { OrderDetail } from "@/core/domain";
import { routes } from "@/core/domain";
import {
  PAY_METHOD_LABEL,
  resolveOrderStatusLabel,
} from "../../_constants";

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
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>주문 생성</span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
          {order.confirmedAt && (
            <div className="flex justify-between">
              <span>결제 완료</span>
              <span>{formatDateTime(order.confirmedAt)}</span>
            </div>
          )}
          {order.invitationStatus === "published" && (
            <div className="flex justify-between">
              <span>청첩장 발행</span>
              <span>완료</span>
            </div>
          )}
          {order.cancelledAt && (
            <div className="flex justify-between">
              <span>주문 취소</span>
              <span>
                {formatDateTime(order.cancelledAt)}
                {order.cancelReason && ` · ${order.cancelReason}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { OrderDetailTemplate };
