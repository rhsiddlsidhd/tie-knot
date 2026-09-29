"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { FilterToggleGroup } from "@/ui/components/molecules/FilterToggleGroup";
import { DataTable } from "@/ui/components/organisms/DataTable";
import { ListPage } from "@/ui/components/templates/ListPage";
import { useOffsetList } from "@/ui/hooks/useOffsetList";
import type { AdminProductSortKey, Product } from "@/core/domain/product";
import { ROUTES } from "@/core/domain/routes";
import { VIEW_FILTER_OPTIONS } from "@/app/(admin)/admin/products/_constants/filterOptions";
import {
  ACTIVE_PRODUCT_TABLE_COLUMNS,
  TRASH_PRODUCT_TABLE_COLUMNS,
} from "@/app/(admin)/admin/products/_constants/tableColumns";
import { ProductTableRow } from "@/app/(admin)/admin/products/_components/ProductTableRow";

const AdminProductsTable = () => {
  const table = useOffsetList<Product, AdminProductSortKey, "view">({
    endpoint: "/api/admin/products",
    params: ["view"],
  });
  const view = table.params.view === "trash" ? "trash" : "active";
  const isTrash = view === "trash";
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
            view={view}
            onRefreshed={refresh}
          />
        )}
        toolbar={
          <FilterToggleGroup
            label="상품 보기"
            options={VIEW_FILTER_OPTIONS}
            value={view}
            onValueChange={(value) =>
              table.setParam("view", value === "active" ? undefined : value)
            }
          />
        }
        sort={table.sort}
        direction={table.direction}
        onSort={table.toggleSort}
        searchValue={table.q}
        onSearch={table.setSearch}
        searchLabel="상품 검색"
        searchPlaceholder="상품명, 카테고리"
        page={table.page}
        totalPages={table.totalPages}
        total={table.total}
        onPageChange={table.setPage}
        isLoading={table.isLoading}
        isValidating={table.isValidating}
        error={table.error}
        onRetry={refresh}
        emptyMessage={
          isTrash ? "삭제된 상품이 없습니다." : "등록된 상품이 없습니다."
        }
      />
    </ListPage>
  );
};

export { AdminProductsTable };
