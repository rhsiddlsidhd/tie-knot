import { Card, CardContent, TypographyH1, TypographyMuted } from "@/ui/components/atoms";
import { MOCK_RATING_AVERAGE, MOCK_RATING_COUNT, MOCK_REVIEWS } from "../_constants";

// 그룹① 확정 방식 — 별점은 ★ 문자 반복으로 표시(새 컴포넌트 아님).
const Stars = ({ rating }: { rating: number }) => (
  <span className="text-primary" aria-label={`별점 ${rating}점`}>
    {"★".repeat(rating)}
    <span className="text-muted-foreground">{"★".repeat(5 - rating)}</span>
  </span>
);

const ReviewsTemplate = () => {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <TypographyH1 className="text-left mb-2 text-3xl font-bold">
          상품 리뷰
        </TypographyH1>
        <TypographyMuted>
          평균 <Stars rating={Math.round(MOCK_RATING_AVERAGE)} />{" "}
          {MOCK_RATING_AVERAGE} ({MOCK_RATING_COUNT}개)
        </TypographyMuted>
      </div>

      <div className="space-y-4">
        {MOCK_REVIEWS.map((review) => (
          <Card key={review.id}>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <Stars rating={review.rating} />
                <TypographyMuted>{review.date}</TypographyMuted>
              </div>
              <p className="text-sm font-medium">{review.author}</p>
              <p className="text-foreground text-sm leading-relaxed">
                {review.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export { ReviewsTemplate };
