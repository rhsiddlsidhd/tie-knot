export const dynamic = "force-dynamic";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { routes } from "@/core/domain";
import { PremiumFeatureRegistrationForm } from "./_containers";
import { Button, TypographyH1, TypographyMuted, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/atoms";
import { verifySession } from "@/services";

export default async function NewPremiumFeaturePage() {
  await verifySession("ADMIN");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={routes.admin.premiumFeatures.root}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <TypographyH1 className="text-left mb-2 text-3xl font-bold">
            프리미엄 기능 등록
          </TypographyH1>
          <TypographyMuted>
            상품에 추가할 수 있는 새로운 유료 기능을 등록합니다.
          </TypographyMuted>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기능 정보</CardTitle>
          <CardDescription>
            프리미엄 기능의 기본 정보를 입력해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PremiumFeatureRegistrationForm />
        </CardContent>
      </Card>
    </div>
  );
}
