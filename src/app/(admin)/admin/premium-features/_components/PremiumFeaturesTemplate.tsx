import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/ui/components/atoms/badge";
import { Button } from "@/ui/components/atoms/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/ui/components/atoms/empty";
import { TableRow, TableCell } from "@/ui/components/atoms/table";
import { TypographyMuted } from "@/ui/components/atoms/typography";
import { AdminListHeading } from "@/ui/components/molecules/AdminListHeading";
import { PaginatedTable } from "@/ui/components/organisms/PaginatedTable";
import { QuerySearchInput } from "@/ui/components/organisms/QuerySearchInput";
import type { AdminPremiumFeatureListPage } from "@/core/domain/premium-feature";
import { formatKstDate } from "@/core/utils/date";
import { ROUTES } from "@/core/domain/routes";
import { PremiumFeatureRowAction } from "@/app/(admin)/admin/premium-features/_containers/PremiumFeatureRowAction";

const TABLE_HEADINGS = [
  "기능 코드",
  "기능 이름",
  "설명",
  "추가 비용",
  "상태",
  "등록일",
  "관리",
];

interface PremiumFeaturesTemplateProps {
  page: AdminPremiumFeatureListPage;
  q?: string;
  cursor?: string;
}

const PremiumFeaturesTemplate = ({
  page,
  q,
  cursor,
}: PremiumFeaturesTemplateProps) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <AdminListHeading
        title="프리미엄 기능 관리"
        subtitle="상품에 추가할 수 있는 유료 기능을 관리합니다."
      />
      <Link href={ROUTES.admin.premiumFeatures.new}>
        <Button size="lg">
          <Plus className="mr-2 h-5 w-5" />
          기능 등록
        </Button>
      </Link>
    </div>

    <QuerySearchInput
      basePath={ROUTES.admin.premiumFeatures.root}
      label="기능 검색"
      value={q}
      placeholder="기능 코드, 기능 이름"
    />

    <PaginatedTable
      headings={TABLE_HEADINGS}
      basePath={ROUTES.admin.premiumFeatures.root}
      query={q ? { q } : {}}
      hasCursor={!!cursor}
      nextCursor={page.nextCursor}
    >
      {page.items.length === 0 ? (
        <TableRow>
          <TableCell colSpan={TABLE_HEADINGS.length}>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>
                  {q ? "검색 결과가 없습니다" : "등록된 기능이 없습니다"}
                </EmptyTitle>
                <EmptyDescription>
                  {q
                    ? "검색어를 지우면 전체 기능을 볼 수 있습니다."
                    : "기능을 등록하면 상품에 추가 옵션으로 붙일 수 있습니다."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </TableCell>
        </TableRow>
      ) : (
        page.items.map((feature) => (
          <TableRow key={feature._id}>
            <TableCell>
              <Badge variant="outline" className="font-mono text-xs">
                {feature.code}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{feature.label}</TableCell>
            <TableCell className="max-w-xs">
              <TypographyMuted className="line-clamp-2">
                {feature.description}
              </TypographyMuted>
            </TableCell>
            <TableCell className="text-primary font-semibold">
              +{feature.additionalPrice.toLocaleString()}원
            </TableCell>
            <TableCell>
              <Badge variant={feature.isActive ? "default" : "secondary"}>
                {feature.isActive ? "등록 가능" : "등록 중단"}
              </Badge>
            </TableCell>
            <TableCell>{formatKstDate(feature.createdAt)}</TableCell>
            <TableCell>
              <PremiumFeatureRowAction premiumFeature={feature} />
            </TableCell>
          </TableRow>
        ))
      )}
    </PaginatedTable>
  </div>
);

export { PremiumFeaturesTemplate };
