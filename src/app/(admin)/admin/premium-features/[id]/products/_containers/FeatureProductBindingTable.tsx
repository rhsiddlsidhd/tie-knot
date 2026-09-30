"use client";

import { ArrowLeft } from "lucide-react";
import { LinkButton } from "@/ui/components/molecules/LinkButton";
import { FilterSelect } from "@/ui/components/molecules/FilterSelect";
import { OffsetPagination } from "@/ui/components/molecules/OffsetPagination/OffsetPagination";
import { SearchInputBar } from "@/ui/components/molecules/SearchInputBar/SearchInputBar";
import { TableQueryState } from "@/ui/components/molecules/TableQueryState/TableQueryState";
import { DataTable } from "@/ui/components/organisms/DataTable";
import { ListPage } from "@/ui/components/templates/ListPage";
import { useOffsetList } from "@/ui/hooks/useOffsetList";
import type {
  FeatureProductBinding,
  FeatureProductBindingSortKey,
} from "@/core/domain/premium-feature";
import {
  FEATURE_PRODUCT_BINDING_SORT_KEYS,
  FEATURE_PRODUCT_BINDING_STATUS_FILTERS,
} from "@/core/domain/premium-feature";
import { ROUTES } from "@/core/domain/routes";
import { ATTACHED_FILTER_OPTIONS } from "@/app/(admin)/admin/premium-features/[id]/products/_constants/filterOptions";
import { FEATURE_PRODUCT_BINDING_TABLE_COLUMNS } from "@/app/(admin)/admin/premium-features/[id]/products/_constants/tableColumns";
import { FeatureProductBindingRow } from "@/app/(admin)/admin/premium-features/[id]/products/_containers/FeatureProductBindingRow";

interface FeatureProductBindingTableProps {
  featureId: string;
  featureLabel: string;
}

const FeatureProductBindingTable = ({
  featureId,
  featureLabel,
}: FeatureProductBindingTableProps) => {
  const table = useOffsetList<
    FeatureProductBinding,
    FeatureProductBindingSortKey,
    { attached: typeof FEATURE_PRODUCT_BINDING_STATUS_FILTERS }
  >({
    endpoint: `/api/admin/premium-features/${featureId}/products`,
    sortKeys: FEATURE_PRODUCT_BINDING_SORT_KEYS,
    params: { attached: FEATURE_PRODUCT_BINDING_STATUS_FILTERS },
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
    : "연결할 수 있는 프리미엄 상품이 없습니다";
  // 첫 로딩·오류 중에는 건수를 모른다 — "총 0건"으로 보이지 않게 숨긴다.
  const pageInfo = table.error ? null : table.pageInfo;

  return (
    <ListPage
      title={`"${featureLabel}" 연결 상품`}
      description="체크하면 바로 반영됩니다. 프리미엄 상품만 목록에 표시됩니다."
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <LinkButton
            variant="ghost"
            size="sm"
            href={ROUTES.admin.premiumFeatures.root}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            기능 목록
          </LinkButton>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <FilterSelect
            ariaLabel="연결 여부 필터"
            allOptionLabel="전체"
            options={ATTACHED_FILTER_OPTIONS}
            value={table.params.attached}
            onValueChange={(value) => table.setParam("attached", value)}
          />
          <div className="w-full sm:max-w-sm">
            <SearchInputBar
              value={table.q}
              onSearch={table.setSearch}
              label="상품 검색"
              placeholder="상품명으로 검색"
            />
          </div>
        </div>

        <DataTable
          columns={FEATURE_PRODUCT_BINDING_TABLE_COLUMNS}
          sortState={table.sortState}
          onSort={table.toggleSort}
          isLoading={isLoadingRows}
          isRefreshing={isRefreshing}
        >
          <TableQueryState
            columnsCount={FEATURE_PRODUCT_BINDING_TABLE_COLUMNS.length}
            error={table.error}
            isLoading={isLoadingRows}
            hasItems={hasItems}
            emptyDescription={emptyDescription}
            onRetry={refresh}
          >
            {items.map((product) => (
              <FeatureProductBindingRow
                key={product._id}
                product={product}
                featureId={featureId}
                onRefreshed={refresh}
              />
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

export { FeatureProductBindingTable };
