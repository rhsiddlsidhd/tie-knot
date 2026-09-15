import type { CursorPage } from "./cursor";

/**
 * 청첩장 템플릿이 실제로 렌더 분기를 구현한 기능 code 목록. 기능의 동작은 코드가
 * 소유하고(DB에서 가져올 수 없다), 이름·설명·가격·판매여부만 DB가 소유한다.
 *
 * 새 기능을 내려면 렌더 분기를 먼저 구현하고 여기에 code를 추가한 뒤 배포한다 —
 * 그래야 관리자가 등록 화면에서 고를 수 있다.
 *
 * 기능을 폐기할 때는 **DB 문서를 먼저 정리한 뒤** 이 목록에서 뺀다. 순서를 바꾸면
 * 그 기능은 수정도 삭제도 못 하는 행으로 남는다 — 수정은 PremiumFeatureSchema의
 * z.enum이 막고, 삭제는 참조 상품 가드가 막는다.
 */
const IMPLEMENTED_PREMIUM_FEATURE_CODES = ["GALLERY_LIGHTBOX"] as const;

type ImplementedPremiumFeatureCode =
  (typeof IMPLEMENTED_PREMIUM_FEATURE_CODES)[number];

type PremiumFeature = {
  _id: string;
  code: string;
  label: string;
  description: string;
  additionalPrice: number;
  isActive: boolean;
  createdAt: string;
};

type AdminPremiumFeatureListPage = CursorPage<PremiumFeature>;

export {
  IMPLEMENTED_PREMIUM_FEATURE_CODES,
  type ImplementedPremiumFeatureCode,
  type PremiumFeature,
  type AdminPremiumFeatureListPage,
};
