"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Button, TypographyH1, TypographyMuted } from "@/ui/components/atoms";
import { CursorPagination, RatingStars } from "@/ui/components/molecules";
import type { AdminReviewListPage } from "@/core/domain";
import { formatKstDate } from "@/core/utils";
import { deleteReviewByAdmin } from "@/actions";

interface AdminReviewsTemplateProps {
  page: AdminReviewListPage;
  cursor?: string;
}

interface ReviewDeleteButtonProps {
  reviewId: string;
  onDeleted: () => void;
}

const ReviewDeleteButton = ({ reviewId, onDeleted }: ReviewDeleteButtonProps) => {
  const [isDeleting, startDeleting] = useTransition();

  const handleDelete = () => {
    if (!window.confirm("이 리뷰를 삭제할까요? 삭제하면 되돌릴 수 없습니다.")) {
      return;
    }

    startDeleting(async () => {
      const result = await deleteReviewByAdmin(reviewId);
      if (result.success === false) {
        toast.error(result.error.message);
        return;
      }
      toast.success(result.data.message);
      onDeleted();
    });
  };

  return (
    <Button size="sm" variant="outline" disabled={isDeleting} onClick={handleDelete}>
      {isDeleting ? "삭제 중..." : "삭제"}
    </Button>
  );
};

const AdminReviewsTemplate = ({ page, cursor }: AdminReviewsTemplateProps) => {
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

export { AdminReviewsTemplate };
