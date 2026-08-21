import type { MockReview } from "../_types";

// 정적 셸 — 실제 리뷰 목록/작성 기능은 별도 작업(원래 page.tsx 주석과 동일한 이유).
// mock 데이터라 API 연동 없이 하드코딩한다.
export const MOCK_RATING_AVERAGE = 4.3;
export const MOCK_RATING_COUNT = 128;

export const MOCK_REVIEWS: MockReview[] = [
  {
    id: "1",
    author: "이서연",
    rating: 5,
    date: "2026.08.05",
    content:
      "종이 질감이 정말 고급스럽고 인쇄 상태도 깔끔했어요. 하객분들 반응이 좋았습니다.",
  },
  {
    id: "2",
    author: "박지훈",
    rating: 4,
    date: "2026.07.29",
    content: "디자인은 예쁜데 배송이 하루 지연됐어요. 그래도 전체적으로 만족합니다.",
  },
  {
    id: "3",
    author: "김민준",
    rating: 5,
    date: "2026.07.18",
    content: "모바일 청첩장 제작이 정말 쉬웠고, 하객분들도 편하게 확인하셨다고 해요.",
  },
];
