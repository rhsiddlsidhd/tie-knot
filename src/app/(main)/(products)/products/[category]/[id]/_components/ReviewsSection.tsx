import Link from "next/link";
import { format } from "date-fns";
import { Button, TypographyH2, TypographyMuted } from "@/ui/components/atoms";
import { CloudImage } from "@/ui/components/molecules";
import { RatingStars } from "@/ui/components/organisms";
import type { ReviewListPage, ReviewSortType } from "@/core/domain";
import { REVIEW_SORT_KEYS, REVIEW_SORT_OPTIONS } from "@/core/domain";

interface ReviewsSectionProps {
  reviews: ReviewListPage;
  sort: ReviewSortType;
}

// 정렬 탭은 커서를 버리고 처음부터 다시 로드한다 — sort가 바뀌면 이전 페이지 누적이
// 더 이상 의미가 없어서다.
const buildSortHref = (sort: ReviewSortType) =>
  sort === "LATEST" ? "?" : `?sort=${sort}`;

const buildMoreHref = (sort: ReviewSortType, cursor: string) => {
  const params = new URLSearchParams();
  if (sort !== "LATEST") params.set("sort", sort);
  params.set("reviewCursor", cursor);
  return `?${params.toString()}`;
};

// admin 목록들과 동일한 searchParams+Link 커서 페이지네이션 패턴 — 클라이언트 fetch나
// route handler 없이 Server Component만으로 더보기/정렬을 처리한다.
const ReviewsSection = ({ reviews, sort }: ReviewsSectionProps) => {
  return (
    <section className="mt-16 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TypographyH2 className="text-xl font-bold">리뷰</TypographyH2>
        <div className="flex gap-2">
          {REVIEW_SORT_KEYS.map((key) => (
            <Button
              key={key}
              asChild
              size="sm"
              variant={key === sort ? "default" : "outline"}
            >
              <Link href={buildSortHref(key)} scroll={false}>
                {REVIEW_SORT_OPTIONS[key]}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {reviews.items.length === 0 ? (
        <TypographyMuted>아직 작성된 리뷰가 없습니다.</TypographyMuted>
      ) : (
        <ul className="space-y-6">
          {reviews.items.map((review) => (
            <li
              key={review._id}
              className="border-border space-y-2 border-b pb-6 last:border-b-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <RatingStars value={review.rating} size="sm" />
                  <span className="text-sm font-medium">
                    {review.authorName}
                  </span>
                </div>
                <TypographyMuted className="text-xs">
                  {format(new Date(review.createdAt), "yyyy.MM.dd")}
                </TypographyMuted>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {review.content}
              </p>
              {review.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {review.images.map((url) => (
                    <div
                      key={url}
                      className="relative h-20 w-20 overflow-hidden rounded-lg"
                    >
                      <CloudImage src={url} alt="리뷰 이미지" sizes="80px" />
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {reviews.nextCursor && (
        <Button asChild variant="outline" className="w-full">
          <Link href={buildMoreHref(sort, reviews.nextCursor)} scroll={false}>
            더보기
          </Link>
        </Button>
      )}
    </section>
  );
};

export { ReviewsSection };
