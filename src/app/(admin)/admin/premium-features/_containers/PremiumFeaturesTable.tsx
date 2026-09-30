"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/ui/components/ui/badge";
import { Button } from "@/ui/components/ui/button";
import { TableCell, TableRow } from "@/ui/components/ui/table";
import { TypographyMuted } from "@/ui/components/atoms/typography";
import { AllOptionSelect } from "@/ui/components/molecules/AllOptionSelect";
import { DataTable } from "@/ui/components/organisms/DataTable";
import { ListPage } from "@/ui/components/templates/ListPage";
import { useOffsetList } from "@/ui/hooks/useOffsetList";
import type {
  AdminPremiumFeatureSortKey,
  PremiumFeature,
} from "@/core/domain/premium-feature";
import {
  ADMIN_PREMIUM_FEATURE_SORT_KEYS,
  ADMIN_PREMIUM_FEATURE_STATUS_FILTERS,
} from "@/core/domain/premium-feature";
import { formatKstDate } from "@/core/utils/date";
import { ROUTES } from "@/core/domain/routes";
import { STATUS_FILTER_OPTIONS } from "@/app/(admin)/admin/premium-features/_constants/filterOptions";
import { PREMIUM_FEATURE_TABLE_COLUMNS } from "@/app/(admin)/admin/premium-features/_constants/tableColumns";
import { PremiumFeatureRowAction } from "@/app/(admin)/admin/premium-features/_containers/PremiumFeatureRowAction";

const PremiumFeaturesTable = () => {
  const table = useOffsetList<
    PremiumFeature,
    AdminPremiumFeatureSortKey,
    { status: typeof ADMIN_PREMIUM_FEATURE_STATUS_FILTERS }
  >({
    endpoint: "/api/admin/premium-features",
    sortKeys: ADMIN_PREMIUM_FEATURE_SORT_KEYS,
    params: { status: ADMIN_PREMIUM_FEATURE_STATUS_FILTERS },
  });
  const refresh = () => {
    void table.mutate();
  };

  return (
    <ListPage
      title="프리미엄 기능 관리"
      description="상품에 추가할 수 있는 유료 기능을 관리합니다."
      actions={
        <Button size="lg" asChild>
          <Link href={ROUTES.admin.premiumFeatures.new}>
            <Plus className="mr-2 h-5 w-5" />
            기능 등록
          </Link>
        </Button>
      }
    >
      <DataTable
        columns={PREMIUM_FEATURE_TABLE_COLUMNS}
        items={table.items}
        getRowKey={(feature) => feature._id}
        renderRow={(feature) => (
          <TableRow>
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
              <PremiumFeatureRowAction
                premiumFeature={feature}
                onRefreshed={refresh}
              />
            </TableCell>
          </TableRow>
        )}
        toolbar={
          <AllOptionSelect
            label="상태 필터"
            allLabel="전체"
            options={STATUS_FILTER_OPTIONS}
            value={table.params.status}
            onValueChange={(value) => table.setParam("status", value)}
          />
        }
        sortState={table.sortState}
        onSort={table.toggleSort}
        search={{
          value: table.q,
          onSearch: table.setSearch,
          label: "기능 검색",
          placeholder: "기능 코드, 기능 이름",
        }}
        pagination={{
          page: table.page,
          onPageChange: table.setPage,
          pageInfo: table.pageInfo,
        }}
        isLoading={table.isLoading}
        isValidating={table.isValidating}
        error={table.error}
        onRetry={refresh}
        empty={{
          default: "등록된 기능이 없습니다",
          search: "검색 결과가 없습니다",
        }}
      />
    </ListPage>
  );
};

export { PremiumFeaturesTable };
