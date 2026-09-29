"use client";

import { TableCell, TableRow } from "@/ui/components/ui/table";
import { DataTable } from "@/ui/components/organisms/DataTable";
import { RatingStars } from "@/ui/components/organisms/RatingStars";
import { ListPage } from "@/ui/components/templates/ListPage";
import { useOffsetList } from "@/ui/hooks/useOffsetList";
import type {
  AdminReviewListItem,
  AdminReviewSortKey,
} from "@/core/domain/review";
import { formatKstDate } from "@/core/utils/date";
import { REVIEW_TABLE_COLUMNS } from "@/app/(admin)/admin/reviews/_constants/tableColumns";
import { ReviewDeleteButton } from "@/app/(admin)/admin/reviews/_containers/ReviewDeleteButton";

const AdminReviewsTable = () => {
  const table = useOffsetList<AdminReviewListItem, AdminReviewSortKey>({
    endpoint: "/api/admin/reviews",
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
        sort={table.sort}
        direction={table.direction}
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
