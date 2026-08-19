import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { routes } from "@/core/domain";
import {
  Button,
  Card,
  CardContent,
  TypographyH1,
  TypographyMuted,
} from "@/ui/components/atoms";
import { Spinner } from "@/ui/components/molecules";

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
              <AlertCircle className="text-destructive h-12 w-12" />
              <TypographyH1 className="text-2xl">
                결제 확인에 실패했습니다
              </TypographyH1>
              <TypographyMuted>{errorMessage}</TypographyMuted>
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
