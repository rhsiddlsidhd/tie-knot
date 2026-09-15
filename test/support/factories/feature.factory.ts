import type { PremiumFeatureDto } from "@/core/schemas/request/premiumFeature.schema";

/**
 * 관리자 등록 경로(createPremiumFeatureService 등)에 넣는 입력. code는 구현된 기능만
 * 허용하는 z.enum으로 좁혀져 있다.
 */
const buildFeatureInput = (
  overrides?: Partial<PremiumFeatureDto>,
): PremiumFeatureDto => ({
  code: "GALLERY_LIGHTBOX",
  label: "갤러리 확대 보기",
  description: "사진을 눌러 전체화면으로 크게 볼 수 있습니다.",
  additionalPrice: 3000,
  ...overrides,
});

/**
 * FeatureModel에 직접 넣는 문서 입력. DB의 code는 평범한 문자열이라 폐기된 코드나
 * 등록 경로를 거치지 않은 값도 담길 수 있다 — 조회·페이징처럼 여러 행이 필요한
 * 테스트는 등록 경로를 우회해 이쪽을 쓴다.
 */
const buildFeatureDocumentInput = (
  overrides?: Partial<Omit<PremiumFeatureDto, "code"> & { code: string }>,
): Omit<PremiumFeatureDto, "code"> & { code: string } => ({
  ...buildFeatureInput(),
  ...overrides,
});

export { buildFeatureInput, buildFeatureDocumentInput };
