import Link from "next/link";
import { Plus } from "lucide-react";
import { Button, TypographyH1, TypographyMuted } from "@/ui/components/atoms";
import { CursorPagination } from "@/ui/components/molecules";
import type { AdminProductListPage } from "@/core/domain";
import { routes } from "@/core/domain";
import { TABLE_COLUMNS } from "../_constants";
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
        <div>
          <TypographyH1 className="text-left mb-2 text-3xl font-bold">
            {isTrash ? "휴지통" : "상품 목록"}
          </TypographyH1>
          <TypographyMuted>
            {isTrash
              ? "삭제된 상품을 조회하고 복구합니다."
              : "등록된 템플릿 상품을 관리합니다."}
          </TypographyMuted>
        </div>
        {!isTrash && (
          <Link href={routes.admin.products.new}>
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              상품 등록
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-2">
        <Link href={routes.admin.products.root}>
          <Button variant={isTrash ? "outline" : "default"} size="sm">
            상품 목록
          </Button>
        </Link>
        <Link href={`${routes.admin.products.root}?view=trash`}>
          <Button variant={isTrash ? "default" : "outline"} size="sm">
            휴지통
          </Button>
        </Link>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                {TABLE_COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-sm font-semibold"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <ProductTableRow key={product._id} product={product} view={view} />
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="py-12 text-center">
            <TypographyMuted>
              {isTrash ? "삭제된 상품이 없습니다." : "등록된 상품이 없습니다."}
            </TypographyMuted>
          </div>
        )}
      </div>

      <CursorPagination
        basePath={routes.admin.products.root}
        query={isTrash ? { view: "trash" } : {}}
        hasCursor={!!cursor}
        nextCursor={page.nextCursor}
      />
    </div>
  );
};

export { AdminProductsTemplate };
