import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/ui/components/atoms/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/ui/components/atoms/empty";
import { TableRow, TableCell } from "@/ui/components/atoms/table";
import { AdminListHeading } from "@/ui/components/molecules/AdminListHeading";
import { PaginatedTable } from "@/ui/components/organisms/PaginatedTable";
import { QuerySearchInput } from "@/ui/components/organisms/QuerySearchInput";
import type { AdminProductListPage } from "@/core/domain/product";
import { ROUTES } from "@/core/domain/routes";
import { TABLE_COLUMNS } from "@/app/(admin)/admin/products/_constants/tableColumns";
import { ProductTableRow } from "./ProductTableRow";

interface AdminProductsTemplateProps {
  page: AdminProductListPage;
  view?: "active" | "trash";
  q?: string;
  cursor?: string;
}

// view 전환은 QueryFilterSelect가 아니라 Link 버튼이라 q를 자동으로 실어주지
// 않는다 — 여기서 직접 조립해 검색 후 view를 바꿔도 검색어가 유지되게 한다.
const buildViewHref = (view: "active" | "trash", q?: string) => {
  const params = new URLSearchParams();
  if (view === "trash") params.set("view", "trash");
  if (q) params.set("q", q);

  const query = params.toString();
  return query
    ? `${ROUTES.admin.products.root}?${query}`
    : ROUTES.admin.products.root;
};

const AdminProductsTemplate = ({
  page,
  view = "active",
  q,
  cursor,
}: AdminProductsTemplateProps) => {
  const isTrash = view === "trash";
  const products = page.items;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <AdminListHeading
          title={isTrash ? "휴지통" : "상품 목록"}
          subtitle={
            isTrash
              ? "삭제된 상품을 조회하고 복구합니다."
              : "등록된 템플릿 상품을 관리합니다."
          }
        />
        {!isTrash && (
          <Link href={ROUTES.admin.products.new}>
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              상품 등록
            </Button>
          </Link>
        )}
      </div>

      <QuerySearchInput
        basePath={ROUTES.admin.products.root}
        label="상품 검색"
        value={q}
        placeholder="상품명, 카테고리"
        preserved={{ view: isTrash ? "trash" : undefined }}
      />

      <div className="flex gap-2">
        <Link href={buildViewHref("active", q)}>
          <Button variant={isTrash ? "outline" : "default"} size="sm">
            상품 목록
          </Button>
        </Link>
        <Link href={buildViewHref("trash", q)}>
          <Button variant={isTrash ? "default" : "outline"} size="sm">
            휴지통
          </Button>
        </Link>
      </div>

      <PaginatedTable
        headings={[...TABLE_COLUMNS]}
        basePath={ROUTES.admin.products.root}
        query={{
          ...(isTrash ? { view: "trash" } : {}),
          ...(q ? { q } : {}),
        }}
        hasCursor={!!cursor}
        nextCursor={page.nextCursor}
      >
        {products.length === 0 ? (
          <TableRow>
            <TableCell colSpan={TABLE_COLUMNS.length}>
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>
                    {isTrash
                      ? "삭제된 상품이 없습니다."
                      : "등록된 상품이 없습니다."}
                  </EmptyTitle>
                </EmptyHeader>
              </Empty>
            </TableCell>
          </TableRow>
        ) : (
          products.map((product) => (
            <ProductTableRow key={product._id} product={product} view={view} />
          ))
        )}
      </PaginatedTable>
    </div>
  );
};

export { AdminProductsTemplate };
