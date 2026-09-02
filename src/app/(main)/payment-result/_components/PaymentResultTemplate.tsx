import Link from "next/link";
import { X } from "lucide-react";
import { routes } from "@/core/domain/routes";
import { Button } from "@/ui/components/atoms/button";
import { Card, CardContent } from "@/ui/components/atoms/card";
import { Spinner } from "@/ui/components/atoms/spinner";
import { TypographyH1, TypographyMuted } from "@/ui/components/atoms/typography";

interface PaymentResultTemplateProps {
  errorMessage: string | null;
}

export function PaymentResultTemplate({
  errorMessage,
}: PaymentResultTemplateProps) {
  return (
    <div className="container mx-auto flex min-h-[60vh] items-center px-4 py-12">
      <Card className="mx-auto w-full max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          {errorMessage ? (
            <>
              <div className="bg-destructive flex h-16 w-16 items-center justify-center rounded-full">
                <X className="text-destructive-foreground h-8 w-8" strokeWidth={3} />
              </div>
              <TypographyH1 className="text-2xl">
                결제 확인에 실패했습니다
              </TypographyH1>
              <TypographyMuted>{errorMessage}</TypographyMuted>
              {/* 이 실패는 결제 자체가 아니라 결제 이후 "검증" 단계에서 난 것이다 —
                  PG 쪽은 이미 승인됐을 수 있어서, 여기서 바로 재시도 버튼을 주면
                  중복 결제로 이어질 수 있다(#91에서 고친 PENDING 재결제 중복 이슈와
                  같은 종류의 위험). 그래서 mockup의 "다시 시도하기" 버튼은 넣지 않고
                  주문 내역에서 실제 상태를 확인하도록만 안내한다. */}
              <Button asChild>
                <Link href={routes.myOrders.root}>주문 내역 확인</Link>
              </Button>
            </>
          ) : (
            <>
              <Spinner />
              <TypographyH1 className="text-2xl">
                결제를 확인하고 있습니다
              </TypographyH1>
              <TypographyMuted>
                페이지를 닫지 말고 잠시만 기다려 주세요.
              </TypographyMuted>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
