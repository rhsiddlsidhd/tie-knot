import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/ui/components/atoms/button";
import { TableRow, TableCell } from "@/ui/components/atoms/table";
import { TypographyMuted } from "@/ui/components/atoms/typography";
import { AdminListHeading } from "@/ui/components/molecules/AdminListHeading";
import { PaginatedTable } from "@/ui/components/organisms/PaginatedTable";
import type { AdminProductListPage } from "@/core/domain/product";
import { ROUTES } from "@/core/domain/routes";
import { TABLE_COLUMNS } from "@/app/(admin)/admin/products/_constants/tableColumns";
import { ProductTableRow } from "./ProductTableRow";

interface AdminProductsTemplateProps {
  page: AdminProductListPage;
  view?: "active" | "trash";
  cursor?: string;
}

const AdminProductsTemplate = ({
  page,
  view = "active",
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

      <div className="flex gap-2">
        <Link href={ROUTES.admin.products.root}>
          <Button variant={isTrash ? "outline" : "default"} size="sm">
            상품 목록
          </Button>
        </Link>
        <Link href={`${ROUTES.admin.products.root}?view=trash`}>
          <Button variant={isTrash ? "default" : "outline"} size="sm">
            휴지통
          </Button>
        </Link>
      </div>

      <PaginatedTable
        headings={[...TABLE_COLUMNS]}
        basePath={ROUTES.admin.products.root}
        query={isTrash ? { view: "trash" } : {}}
        hasCursor={!!cursor}
        nextCursor={page.nextCursor}
      >
        {products.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={TABLE_COLUMNS.length}
              className="py-12 text-center"
            >
              <TypographyMuted>
                {isTrash ? "삭제된 상품이 없습니다." : "등록된 상품이 없습니다."}
              </TypographyMuted>
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
