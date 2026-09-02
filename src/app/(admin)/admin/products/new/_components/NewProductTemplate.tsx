import type { PremiumFeature } from "@/core/domain/premium-feature";
import { routes } from "@/core/domain/routes";
import { Button, TypographyH1, TypographyMuted } from "@/ui/components/atoms";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ProductRegistrationForm } from "../_containers";

interface NewProductTemplateProps {
  premiumFeatures: PremiumFeature[];
}

const NewProductTemplate = ({ premiumFeatures }: NewProductTemplateProps) => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <Link href={routes.admin.products.root}>
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>
      <div>
        <TypographyH1 className="mb-2 text-left text-3xl font-bold">
          상품 등록
        </TypographyH1>
        <TypographyMuted>새로운 템플릿 상품을 등록합니다.</TypographyMuted>
      </div>
    </div>

    <ProductRegistrationForm premiumFeatures={premiumFeatures} />
  </div>
);

export { NewProductTemplate };
