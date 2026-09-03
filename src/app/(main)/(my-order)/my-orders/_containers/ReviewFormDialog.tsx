"use client";

import { useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/ui/components/atoms/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/components/atoms/dialog";
import { Textarea } from "@/ui/components/atoms/textarea";
import { ConfirmDialog } from "@/ui/components/molecules/ConfirmDialog";
import { ImageField } from "@/ui/components/organisms/ImageField";
import { RatingStars } from "@/ui/components/organisms/RatingStars";
import { useImageList } from "@/ui/hooks/useImageList";
import { getFieldError, hasFieldErrors } from "@/core/utils/error";
import type { APIResponse } from "@/core/domain/error";
import type { OrderReviewSummary } from "@/core/domain/order";
import { createReview } from "@/actions/createReview";
import { deleteReview } from "@/actions/deleteReview";
import { updateReview } from "@/actions/updateReview";

interface ReviewFormDialogProps {
  orderId: string;
  review: OrderReviewSummary | null;
}

type ReviewActionResult = APIResponse<{ message: string }>;

// review 유무에 따라 작성/수정 모드가 갈린다 — 호출부(OrderCard)가 review.id를 key로
// 넘겨서, 작성 직후 review가 새로 생기면 이 컴포넌트를 통째로 재마운트한다(내부 state를
// 새 review 기준으로 다시 초기화하기 위함, useState 초기값은 최초 마운트에만 적용되므로).
//
// useActionState 대신 수동 onSubmit+useTransition을 쓴다 — 성공 시 다이얼로그를 닫고
// router.refresh()까지 이어지는데, 이 setState 호출을 useActionState의 effect 안에서
// 하면 "setState in effect" 경고 대상이라 이벤트 핸들러(transition 콜백) 안에서 처리한다.
const ReviewFormDialog = ({ orderId, review }: ReviewFormDialogProps) => {
  const isEdit = Boolean(review);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [result, setResult] = useState<ReviewActionResult | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  // 확인창이 닫히면 바깥 Dialog의 FocusScope가 자기 컨테이너로 포커스를 되가져간다 —
  // 삭제를 시작한 버튼으로 되돌려 키보드 사용자의 위치를 잃지 않게 한다.
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const images = useImageList(review?.images);
  const router = useRouter();
  const [isSubmitting, startSubmitting] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const handleSuccess = (message: string) => {
    toast.success(message);
    setOpen(false);
    router.refresh();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startSubmitting(async () => {
      const response = isEdit
        ? await updateReview(null, formData)
        : await createReview(null, formData);
      setResult(response);

      if (response.success === true) {
        handleSuccess(response.data.message);
      } else if (!hasFieldErrors(response.error)) {
        toast.error(response.error.message);
      }
    });
  };

  const handleDelete = () => {
    if (!review) return;

    startDeleting(async () => {
      const response = await deleteReview(review.id);

      if (response.success === false) {
        // 실패하면 확인창과 리뷰 다이얼로그를 모두 열어둔 채 재시도할 수 있게 남긴다.
        toast.error(response.error.message);
        return;
      }
      setIsDeleteConfirmOpen(false);
      handleSuccess(response.data.message);
    });
  };

  const ratingError = getFieldError(result, "rating");
  const contentError = getFieldError(result, "content");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline">
          {isEdit ? "리뷰 보기·수정" : "리뷰 작성"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "리뷰 수정" : "리뷰 작성"}</DialogTitle>
            <DialogDescription>
              구매하신 상품은 어떠셨나요? 다른 분들에게 도움이 되는 후기를
              남겨주세요.
            </DialogDescription>
          </DialogHeader>

          {isEdit ? (
            <input type="hidden" name="reviewId" value={review!.id} />
          ) : (
            <input type="hidden" name="orderId" value={orderId} />
          )}
          <input type="hidden" name="rating" value={rating} />

          <div className="space-y-2">
            <span className="text-sm font-medium">평점</span>
            <RatingStars value={rating} onChange={setRating} />
            {ratingError && (
              <p className="text-destructive text-sm">{ratingError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              리뷰 내용
            </label>
            <Textarea
              id="content"
              name="content"
              rows={5}
              defaultValue={review?.content}
              placeholder="상품에 대한 솔직한 후기를 남겨주세요. (최소 10자)"
              aria-invalid={Boolean(contentError)}
            />
            {contentError && (
              <p className="text-destructive text-sm">{contentError}</p>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">사진 (선택, 최대 5장)</span>
            <ImageField
              id="review-images"
              items={images.items}
              folder="reviews"
              onAdd={images.add}
              onRemove={images.remove}
              maxCount={5}
            />
            {images.getUrls().map((url) => (
              <input key={url} type="hidden" name="images" value={url} />
            ))}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {isEdit && (
              <Button
                ref={deleteButtonRef}
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={() => setIsDeleteConfirmOpen(true)}
              >
                {isDeleting ? "삭제 중..." : "리뷰 삭제"}
              </Button>
            )}
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  취소
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || rating === 0}>
                {isSubmitting ? "저장 중..." : isEdit ? "수정하기" : "등록하기"}
              </Button>
            </div>
          </DialogFooter>
        </form>

        {isEdit && (
          <ConfirmDialog
            open={isDeleteConfirmOpen}
            onOpenChange={setIsDeleteConfirmOpen}
            title="리뷰 삭제"
            description="작성한 리뷰를 삭제합니다. 삭제한 리뷰는 복구할 수 없습니다."
            confirmLabel="삭제"
            pendingLabel="삭제 중..."
            pending={isDeleting}
            onConfirm={handleDelete}
            restoreFocusRef={deleteButtonRef}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export { ReviewFormDialog };
