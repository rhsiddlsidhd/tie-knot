"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/ui/components/ui/badge";
import { Button } from "@/ui/components/ui/button";
import { TableCell, TableRow } from "@/ui/components/ui/table";
import { TypographyMuted } from "@/ui/components/atoms/typography";
import { FilterSelect } from "@/ui/components/molecules/FilterSelect";
import { OffsetPagination } from "@/ui/components/molecules/OffsetPagination/OffsetPagination";
import { SearchInputBar } from "@/ui/components/molecules/SearchInputBar/SearchInputBar";
import { TableQueryState } from "@/ui/components/molecules/TableQueryState/TableQueryState";
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

  const items = table.items ?? [];
  const hasItems = items.length > 0;
  // TableQueryState는 오류를 먼저 판정하므로 두 곳에 같은 값을 넘겨도 된다.
  const isLoadingRows = !table.error && table.isLoading;
  const isRefreshing = !table.error && table.isValidating && hasItems;
  const emptyDescription = table.q
    ? "검색 결과가 없습니다"
    : "등록된 기능이 없습니다";
  // 첫 로딩·오류 중에는 건수를 모른다 — "총 0건"으로 보이지 않게 숨긴다.
  const pageInfo = table.error ? null : table.pageInfo;

  return (
    <ListPage
      title="프리미엄 기능 관리"
      description="상품에 추가할 수 있는 유료 기능을 관리합니다."
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="lg" asChild>
            <Link href={ROUTES.admin.premiumFeatures.new}>
              <Plus className="mr-2 h-5 w-5" />
              기능 등록
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <FilterSelect
            ariaLabel="상태 필터"
            allOptionLabel="전체"
            options={STATUS_FILTER_OPTIONS}
            value={table.params.status}
            onValueChange={(value) => table.setParam("status", value)}
          />
          <div className="w-full sm:max-w-sm">
            <SearchInputBar
              value={table.q}
              onSearch={table.setSearch}
              label="기능 검색"
              placeholder="기능 코드, 기능 이름"
            />
          </div>
        </div>

        <DataTable
          columns={PREMIUM_FEATURE_TABLE_COLUMNS}
          sortState={table.sortState}
          onSort={table.toggleSort}
          isLoading={isLoadingRows}
          isRefreshing={isRefreshing}
        >
          <TableQueryState
            columnsCount={PREMIUM_FEATURE_TABLE_COLUMNS.length}
            error={table.error}
            isLoading={isLoadingRows}
            hasItems={hasItems}
            emptyDescription={emptyDescription}
            onRetry={refresh}
          >
            {items.map((feature) => (
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
                  <PremiumFeatureRowAction
                    premiumFeature={feature}
                    onRefreshed={refresh}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableQueryState>
        </DataTable>

        {pageInfo && (
          <OffsetPagination
            page={table.page}
            totalPages={pageInfo.totalPages}
            total={pageInfo.total}
            onPageChange={table.setPage}
          />
        )}
      </div>
    </ListPage>
  );
};

export { PremiumFeaturesTable };
