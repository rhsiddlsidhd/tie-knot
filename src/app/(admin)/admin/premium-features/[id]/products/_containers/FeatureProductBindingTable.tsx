"use client";

import { ArrowLeft } from "lucide-react";
import { LinkButton } from "@/ui/components/molecules/LinkButton";
import { DataTable } from "@/ui/components/organisms/DataTable";
import { ListPage } from "@/ui/components/templates/ListPage";
import { useOffsetList } from "@/ui/hooks/useOffsetList";
import type {
  FeatureProductBinding,
  FeatureProductBindingSortKey,
} from "@/core/domain/premium-feature";
import { FEATURE_PRODUCT_BINDING_SORT_KEYS } from "@/core/domain/premium-feature";
import { ROUTES } from "@/core/domain/routes";
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
    FeatureProductBindingSortKey
  >({
    endpoint: `/api/admin/premium-features/${featureId}/products`,
    sortKeys: FEATURE_PRODUCT_BINDING_SORT_KEYS,
    params: {},
  });
  const refresh = () => {
    void table.mutate();
  };

  return (
    <ListPage
      title={`"${featureLabel}" 연결 상품`}
      description="체크하면 바로 반영됩니다. 프리미엄 상품만 목록에 표시됩니다."
      actions={
        <LinkButton
          variant="ghost"
          size="sm"
          href={ROUTES.admin.premiumFeatures.root}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          기능 목록
        </LinkButton>
      }
    >
      <DataTable
        columns={FEATURE_PRODUCT_BINDING_TABLE_COLUMNS}
        items={table.items}
        getRowKey={(product) => product._id}
        renderRow={(product) => (
          <FeatureProductBindingRow
            product={product}
            featureId={featureId}
            onRefreshed={refresh}
          />
        )}
        sortState={table.sortState}
        onSort={table.toggleSort}
        search={{
          value: table.q,
          onSearch: table.setSearch,
          label: "상품 검색",
          placeholder: "상품명으로 검색",
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
          default: "연결할 수 있는 프리미엄 상품이 없습니다",
          search: "검색 결과가 없습니다",
        }}
      />
    </ListPage>
  );
};

export { FeatureProductBindingTable };
