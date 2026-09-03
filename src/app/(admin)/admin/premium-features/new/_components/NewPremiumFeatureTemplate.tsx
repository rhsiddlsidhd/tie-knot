import { routes } from "@/core/domain/routes";
import { Button } from "@/ui/components/atoms/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/atoms/card";
import { TypographyH1, TypographyMuted } from "@/ui/components/atoms/typography";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PremiumFeatureRegistrationForm } from "@/app/(admin)/admin/premium-features/new/_containers/PremiumFeatureRegistrationForm";

const NewPremiumFeatureTemplate = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <Link href={routes.admin.premiumFeatures.root}>
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>
      <div>
        <TypographyH1 className="mb-2 text-left text-3xl font-bold">
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

export { NewPremiumFeatureTemplate };
