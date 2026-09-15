import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

import { Button } from "@/ui/components/atoms/button";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/ui/components/atoms/empty";
import { Input } from "@/ui/components/atoms/input";
import { Label } from "@/ui/components/atoms/label";
import { TableRow, TableCell } from "@/ui/components/atoms/table";
import { AdminListHeading } from "@/ui/components/molecules/AdminListHeading";
import { PaginatedTable } from "@/ui/components/organisms/PaginatedTable";
import type { FeatureProductBindingPage } from "@/core/domain/premium-feature";
import { ROUTES } from "@/core/domain/routes";
import { FeatureProductBindingRow } from "@/app/(admin)/admin/premium-features/[id]/products/_containers/FeatureProductBindingRow";

const TABLE_HEADINGS = ["연결", "상품명", "가격", "상태"];

interface FeatureProductBindingTemplateProps {
  featureId: string;
  featureLabel: string;
  page: FeatureProductBindingPage;
  q?: string;
  cursor?: string;
}

const FeatureProductBindingTemplate = ({
  featureId,
  featureLabel,
  page,
  q,
  cursor,
}: FeatureProductBindingTemplateProps) => (
  <div className="space-y-6">
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href={ROUTES.admin.premiumFeatures.root}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          기능 목록
        </Link>
      </Button>
      <AdminListHeading
        title={`"${featureLabel}" 연결 상품`}
        subtitle="체크하면 바로 반영됩니다. 프리미엄 상품만 목록에 표시됩니다."
      />
    </div>

    {/*
      검색은 GET 폼이라 제출하면 q만 실린다 — cursor가 자동으로 떨어져 새 검색이
      항상 첫 페이지에서 시작한다(#309 규약).
    */}
    <form
      action={ROUTES.admin.premiumFeatures.products(featureId)}
      className="flex items-end gap-2"
    >
      <div className="flex-1 space-y-2">
        <Label htmlFor="q">상품 검색</Label>
        <Input
          id="q"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="상품명으로 검색"
        />
      </div>
      <Button type="submit" variant="outline">
        <Search className="mr-1 h-4 w-4" />
        검색
      </Button>
    </form>

    <PaginatedTable
      headings={TABLE_HEADINGS}
      basePath={ROUTES.admin.premiumFeatures.products(featureId)}
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
                  {q
                    ? "검색 결과가 없습니다"
                    : "연결할 수 있는 프리미엄 상품이 없습니다"}
                </EmptyTitle>
                <EmptyDescription>
                  {q
                    ? "검색어를 지우면 전체 상품을 볼 수 있습니다."
                    : "상품을 프리미엄 상품으로 등록하면 여기에 표시됩니다."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </TableCell>
        </TableRow>
      ) : (
        page.items.map((product) => (
          <FeatureProductBindingRow
            key={product._id}
            product={product}
            featureId={featureId}
          />
        ))
      )}
    </PaginatedTable>
  </div>
);

export { FeatureProductBindingTemplate };
