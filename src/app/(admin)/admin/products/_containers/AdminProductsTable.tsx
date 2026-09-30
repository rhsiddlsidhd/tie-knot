"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { AllOptionSelect } from "@/ui/components/molecules/AllOptionSelect";
import { LabeledSwitch } from "@/ui/components/molecules/LabeledSwitch";
import { DataTable } from "@/ui/components/organisms/DataTable";
import { ListPage } from "@/ui/components/templates/ListPage";
import { useOffsetList } from "@/ui/hooks/useOffsetList";
import type { AdminProductSortKey, Product } from "@/core/domain/product";
import {
  ADMIN_PRODUCT_SOFT_DELETED_VALUES,
  ADMIN_PRODUCT_SORT_KEYS,
  ADMIN_PRODUCT_TYPE_FILTERS,
  EDITABLE_PRODUCT_STATUSES,
} from "@/core/domain/product";
import { ROUTES } from "@/core/domain/routes";
import {
  STATUS_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
} from "@/app/(admin)/admin/products/_constants/filterOptions";
import {
  ACTIVE_PRODUCT_TABLE_COLUMNS,
  TRASH_PRODUCT_TABLE_COLUMNS,
} from "@/app/(admin)/admin/products/_constants/tableColumns";
import { ProductTableRow } from "@/app/(admin)/admin/products/_components/ProductTableRow";

const AdminProductsTable = () => {
  const table = useOffsetList<
    Product,
    AdminProductSortKey,
    {
      softDeleted: typeof ADMIN_PRODUCT_SOFT_DELETED_VALUES;
      status: typeof EDITABLE_PRODUCT_STATUSES;
      type: typeof ADMIN_PRODUCT_TYPE_FILTERS;
    }
  >({
    endpoint: "/api/admin/products",
    sortKeys: ADMIN_PRODUCT_SORT_KEYS,
    params: {
      softDeleted: ADMIN_PRODUCT_SOFT_DELETED_VALUES,
      status: EDITABLE_PRODUCT_STATUSES,
      type: ADMIN_PRODUCT_TYPE_FILTERS,
    },
  });
  const isTrash = table.params.softDeleted === "true";
  const refresh = () => {
    void table.mutate();
  };

  return (
    <ListPage
      title={isTrash ? "휴지통" : "상품 목록"}
      description={
        isTrash
          ? "삭제된 상품을 조회하고 복구합니다."
          : "등록된 템플릿 상품을 관리합니다."
      }
      actions={
        !isTrash && (
          <Button size="lg" asChild>
            <Link href={ROUTES.admin.products.new}>
              <Plus className="mr-2 h-5 w-5" />
              상품 등록
            </Link>
          </Button>
        )
      }
    >
      <DataTable
        columns={
          isTrash ? TRASH_PRODUCT_TABLE_COLUMNS : ACTIVE_PRODUCT_TABLE_COLUMNS
        }
        items={table.items}
        getRowKey={(product) => product._id}
        renderRow={(product) => (
          <ProductTableRow
            product={product}
            softDeleted={isTrash}
            onRefreshed={refresh}
          />
        )}
        toolbar={
          <div className="flex flex-wrap gap-4">
            <LabeledSwitch
              id="admin-products-soft-deleted"
              label="휴지통"
              checked={isTrash}
              onCheckedChange={(checked) =>
                table.setParam("softDeleted", checked ? "true" : null)
              }
            />
            {!isTrash && (
              <AllOptionSelect
                label="상태 필터"
                allLabel="전체 상태"
                options={STATUS_FILTER_OPTIONS}
                value={table.params.status}
                onValueChange={(value) => table.setParam("status", value)}
              />
            )}
            {!isTrash && (
              <AllOptionSelect
                label="타입 필터"
                allLabel="전체 타입"
                options={TYPE_FILTER_OPTIONS}
                value={table.params.type}
                onValueChange={(value) => table.setParam("type", value)}
              />
            )}
          </div>
        }
        sortState={table.sortState}
        onSort={table.toggleSort}
        search={{
          value: table.q,
          onSearch: table.setSearch,
          label: "상품 검색",
          placeholder: "상품명, 카테고리",
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
          default: isTrash
            ? "삭제된 상품이 없습니다."
            : "등록된 상품이 없습니다.",
          search: "검색 결과가 없습니다.",
        }}
      />
    </ListPage>
  );
};

export { AdminProductsTable };
