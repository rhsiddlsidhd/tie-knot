import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/ui/components/atoms/empty";
import { TableRow, TableCell } from "@/ui/components/atoms/table";
import { AdminListHeading } from "@/ui/components/molecules/AdminListHeading";
import { PaginatedTable } from "@/ui/components/organisms/PaginatedTable";
import { QuerySearchInput } from "@/ui/components/organisms/QuerySearchInput";
import { RatingStars } from "@/ui/components/organisms/RatingStars";
import type { AdminReviewListPage } from "@/core/domain/review";
import { formatKstDate } from "@/core/utils/date";
import { ROUTES } from "@/core/domain/routes";
import { ReviewDeleteButton } from "@/app/(admin)/admin/reviews/_containers/ReviewDeleteButton";

const TABLE_HEADINGS = ["상품", "작성자", "평점", "내용", "작성일", "관리"];

interface AdminReviewsTemplateProps {
  page: AdminReviewListPage;
  q?: string;
  cursor?: string;
}

const AdminReviewsTemplate = ({
  page,
  q,
  cursor,
}: AdminReviewsTemplateProps) => (
  <div className="space-y-6">
    <AdminListHeading title="리뷰 관리" />

    <QuerySearchInput
      basePath={ROUTES.admin.reviews}
      label="리뷰 검색"
      value={q}
      placeholder="작성자 이메일, 상품명"
    />

    <PaginatedTable
      headings={TABLE_HEADINGS}
      basePath={ROUTES.admin.reviews}
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
                  {q ? "검색 결과가 없습니다" : "등록된 리뷰가 없습니다"}
                </EmptyTitle>
                <EmptyDescription>
                  {q
                    ? "검색어를 지우면 전체 리뷰를 볼 수 있습니다."
                    : "구매자가 리뷰를 작성하면 여기 표시됩니다."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </TableCell>
        </TableRow>
      ) : (
        page.items.map((review) => (
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
              />
            </TableCell>
          </TableRow>
        ))
      )}
    </PaginatedTable>
  </div>
);

export { AdminReviewsTemplate };
