"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/ui/components/atoms/button";
import { ConfirmDialog } from "@/ui/components/molecules/ConfirmDialog";
import { deleteReviewByAdmin } from "@/actions/deleteReviewByAdmin";

interface ReviewDeleteButtonProps {
  reviewId: string;
  authorName: string;
  productTitle: string;
}

const ReviewDeleteButton = ({
  reviewId,
  authorName,
  productTitle,
}: ReviewDeleteButtonProps) => {
  const router = useRouter();
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
      router.refresh();
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

export { ReviewDeleteButton };
