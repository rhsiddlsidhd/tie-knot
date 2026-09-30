"use client";

import { TableCell, TableRow } from "@/ui/components/ui/table";
import { FilterSelect } from "@/ui/components/molecules/FilterSelect";
import { OffsetPagination } from "@/ui/components/molecules/OffsetPagination/OffsetPagination";
import { SearchInputBar } from "@/ui/components/molecules/SearchInputBar/SearchInputBar";
import { TableQueryState } from "@/ui/components/molecules/TableQueryState/TableQueryState";
import { DataTable } from "@/ui/components/organisms/DataTable";
import { RatingStars } from "@/ui/components/organisms/RatingStars";
import { ListPage } from "@/ui/components/templates/ListPage";
import { useOffsetList } from "@/ui/hooks/useOffsetList";
import type {
  AdminReviewListItem,
  AdminReviewSortKey,
} from "@/core/domain/review";
import { ADMIN_REVIEW_SORT_KEYS } from "@/core/domain/review";
import { formatKstDate } from "@/core/utils/date";
import {
  RATING_FILTER_OPTIONS,
  RATING_FILTER_VALUES,
} from "@/app/(admin)/admin/reviews/_constants/filterOptions";
import { REVIEW_TABLE_COLUMNS } from "@/app/(admin)/admin/reviews/_constants/tableColumns";
import { ReviewDeleteButton } from "@/app/(admin)/admin/reviews/_containers/ReviewDeleteButton";

const AdminReviewsTable = () => {
  const table = useOffsetList<
    AdminReviewListItem,
    AdminReviewSortKey,
    { rating: typeof RATING_FILTER_VALUES }
  >({
    endpoint: "/api/admin/reviews",
    sortKeys: ADMIN_REVIEW_SORT_KEYS,
    params: { rating: RATING_FILTER_VALUES },
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
    : "등록된 리뷰가 없습니다";
  // 첫 로딩·오류 중에는 건수를 모른다 — "총 0건"으로 보이지 않게 숨긴다.
  const pageInfo = table.error ? null : table.pageInfo;

  return (
    <ListPage title="리뷰 관리">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <FilterSelect
            ariaLabel="평점 필터"
            allOptionLabel="전체 평점"
            options={RATING_FILTER_OPTIONS}
            value={table.params.rating}
            onValueChange={(value) => table.setParam("rating", value)}
          />
          <div className="w-full sm:max-w-sm">
            <SearchInputBar
              value={table.q}
              onSearch={table.setSearch}
              label="리뷰 검색"
              placeholder="작성자 이메일, 상품명"
            />
          </div>
        </div>

        <DataTable
          columns={REVIEW_TABLE_COLUMNS}
          sortState={table.sortState}
          onSort={table.toggleSort}
          isLoading={isLoadingRows}
          isRefreshing={isRefreshing}
        >
          <TableQueryState
            columnsCount={REVIEW_TABLE_COLUMNS.length}
            error={table.error}
            isLoading={isLoadingRows}
            hasItems={hasItems}
            emptyDescription={emptyDescription}
            onRetry={refresh}
          >
            {items.map((review) => (
              <TableRow key={review.id}>
                <TableCell>{review.productTitle}</TableCell>
                <TableCell>{review.authorName}</TableCell>
                <TableCell>
                  <RatingStars value={review.rating} size="sm" />
                </TableCell>
                <TableCell className="max-w-xs">
                  <p className="line-clamp-2">{review.content}</p>
                </TableCell>
                <TableCell>{formatKstDate(review.createdAt)}</TableCell>
                <TableCell>
                  <ReviewDeleteButton
                    reviewId={review.id}
                    authorName={review.authorName}
                    productTitle={review.productTitle}
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

export { AdminReviewsTable };
