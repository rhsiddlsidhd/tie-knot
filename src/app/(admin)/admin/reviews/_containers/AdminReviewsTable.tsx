"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/ui/components/atoms/button";
import { TypographyH1, TypographyMuted } from "@/ui/components/atoms/typography";
import { ConfirmDialog } from "@/ui/components/molecules/ConfirmDialog";
import { CursorPagination } from "@/ui/components/molecules/CursorPagination";
import { RatingStars } from "@/ui/components/organisms/RatingStars";
import type { AdminReviewListPage } from "@/core/domain/review";
import { formatKstDate } from "@/core/utils/date";
import { deleteReviewByAdmin } from "@/actions/deleteReviewByAdmin";

interface AdminReviewsTableProps {
  page: AdminReviewListPage;
  cursor?: string;
}

interface ReviewDeleteButtonProps {
  reviewId: string;
  authorName: string;
  productTitle: string;
  onDeleted: () => void;
}

const ReviewDeleteButton = ({
  reviewId,
  authorName,
  productTitle,
  onDeleted,
}: ReviewDeleteButtonProps) => {
  const [isDeleting, startDeleting] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = () => {
    startDeleting(async () => {
      const result = await deleteReviewByAdmin(reviewId);
      if (result.success === false) {
        // 실패하면 다이얼로그를 열어둔 채 재시도할 수 있게 남긴다.
        toast.error(result.error.message);
        return;
      }
      toast.success(result.data.message);
      setIsConfirmOpen(false);
      onDeleted();
    });
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={isDeleting}
        onClick={() => setIsConfirmOpen(true)}
      >
        {isDeleting ? "삭제 중..." : "삭제"}
      </Button>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="리뷰 삭제"
        description={`${authorName}님이 "${productTitle}"에 남긴 리뷰를 삭제합니다. 삭제한 리뷰는 복구할 수 없습니다.`}
        confirmLabel="삭제"
        pendingLabel="삭제 중..."
        pending={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
};

const AdminReviewsTable = ({ page, cursor }: AdminReviewsTableProps) => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <TypographyH1 className="text-left text-3xl font-bold">
        리뷰 관리
      </TypographyH1>

      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">상품</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">작성자</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">평점</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">내용</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">작성일</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {page.items.map((review) => (
                <tr key={review.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm">{review.productTitle}</td>
                  <td className="px-4 py-3 text-sm">{review.authorName}</td>
                  <td className="px-4 py-3">
                    <RatingStars value={review.rating} size="sm" />
                  </td>
                  <td className="max-w-xs px-4 py-3 text-sm">
                    <p className="line-clamp-2">{review.content}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatKstDate(review.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ReviewDeleteButton
                      reviewId={review.id}
                      authorName={review.authorName}
                      productTitle={review.productTitle}
                      onDeleted={() => router.refresh()}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {page.items.length === 0 && (
          <div className="flex flex-col items-center gap-1 py-16 text-center">
            <p className="text-sm font-medium">등록된 리뷰가 없습니다</p>
            <TypographyMuted>구매자가 리뷰를 작성하면 여기 표시됩니다.</TypographyMuted>
          </div>
        )}
      </div>

      <CursorPagination
        basePath={pathname}
        hasCursor={!!cursor}
        nextCursor={page.nextCursor}
      />
    </div>
  );
};

export { AdminReviewsTable };
