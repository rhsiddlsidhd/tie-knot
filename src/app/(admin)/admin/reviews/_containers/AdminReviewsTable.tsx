"use client";

import { TableCell, TableRow } from "@/ui/components/ui/table";
import { AllOptionSelect } from "@/ui/components/molecules/AllOptionSelect";
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

  return (
    <ListPage title="리뷰 관리">
      <DataTable
        columns={REVIEW_TABLE_COLUMNS}
        items={table.items}
        getRowKey={(review) => review.id}
        renderRow={(review) => (
          <TableRow>
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
        )}
        toolbar={
          <AllOptionSelect
            label="평점 필터"
            options={RATING_FILTER_OPTIONS}
            value={table.params.rating}
            onValueChange={(value) => table.setParam("rating", value)}
          />
        }
        sortState={table.sortState}
        onSort={table.toggleSort}
        search={{
          value: table.q,
          onSearch: table.setSearch,
          label: "리뷰 검색",
          placeholder: "작성자 이메일, 상품명",
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
          default: "등록된 리뷰가 없습니다",
          search: "검색 결과가 없습니다",
        }}
      />
    </ListPage>
  );
};

export { AdminReviewsTable };
