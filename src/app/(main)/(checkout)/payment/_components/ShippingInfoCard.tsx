import { Card, CardContent, CardHeader, CardTitle, Input } from "@/ui/components/atoms";
import { FormField } from "@/ui/components/molecules";

// 배송 정보는 아직 저장할 곳이 없다(Order 모델에 주소 필드 없음, 별도 Issue로 등록 예정 —
// feat/brand-design-tokens plan 참고) — 그래서 아래 입력들은 의도적으로 name 속성이 없다.
// name이 없는 input은 폼 제출(FormData) 시 자동으로 제외되므로, 여기서 값을 따로
// 가로채 지우는 코드 없이도 "화면엔 있지만 서버로는 안 감"이 보장된다.
export function ShippingInfoCard() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
            2
          </span>
          배송 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="shippingReceiver" label="받는 분">
            <Input id="shippingReceiver" type="text" placeholder="홍길동" />
          </FormField>
          <FormField id="shippingPhone" label="연락처">
            <Input id="shippingPhone" type="tel" placeholder="010-1234-5678" />
          </FormField>
        </div>
        <FormField id="shippingAddress" label="배송 주소">
          <Input
            id="shippingAddress"
            type="text"
            placeholder="도로명 주소를 입력해주세요"
          />
        </FormField>
        <p className="text-muted-foreground text-xs">
          배송 정보는 저장 준비 중입니다. 실물 상품 주문 시에도 현재는 별도 안내로
          연락드립니다.
        </p>
      </CardContent>
    </Card>
  );
}
