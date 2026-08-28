import { Card, CardContent, CardHeader, CardTitle, Input } from "@/ui/components/atoms";
import { AddressField, FormField } from "@/ui/components/molecules";
import type { ShippingInfo } from "@/core/schemas";

interface ShippingInfoCardProps {
  step: number;
  errors: Partial<Record<keyof ShippingInfo, string[]>>;
}

// 실물 상품(favor/accessory/guestbook/ceremony) 주문일 때만 렌더된다 — 모바일초대장
// 주문은 배송이 필요 없어 이 카드 자체가 트리에서 빠진다(CheckoutForm organism 참고).
// 그래서 여기 렌더되면 모든 필드가 항상 필수다.
export function ShippingInfoCard({ step, errors }: ShippingInfoCardProps) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
            {step}
          </span>
          배송 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="shippingReceiver" label="받는 분" error={errors.receiver?.[0]} required>
            <Input
              id="shippingReceiver"
              name="shippingReceiver"
              type="text"
              placeholder="홍길동"
              required
              aria-invalid={!!errors.receiver?.[0]}
            />
          </FormField>
          <FormField id="shippingPhone" label="연락처" error={errors.phone?.[0]} required>
            <Input
              id="shippingPhone"
              name="shippingPhone"
              type="tel"
              placeholder="010-1234-5678"
              required
              aria-invalid={!!errors.phone?.[0]}
            />
          </FormField>
        </div>
        <AddressField
          name="ship"
          required
          error={errors.address?.[0]}
          addressDetailError={errors.addressDetail?.[0]}
        />
      </CardContent>
    </Card>
  );
}
