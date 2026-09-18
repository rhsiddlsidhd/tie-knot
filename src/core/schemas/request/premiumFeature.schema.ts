import * as z from "zod";
import { IMPLEMENTED_PREMIUM_FEATURE_CODES } from "@/core/domain/premium-feature";

const PremiumFeatureSchema = z.object({
  // code는 청첩장 템플릿의 렌더 분기 키다 — 구현되지 않은 code를 등록하면 팔리기는
  // 하는데 청첩장에서 아무 일도 일어나지 않는다. 등록 폼이 Select로 좁혀 주지만
  // Server Action은 FormData를 직접 만들어 호출할 수 있어 여기서도 막는다.
  code: z.enum(IMPLEMENTED_PREMIUM_FEATURE_CODES, {
    message: "지원하지 않는 기능 코드입니다.",
  }),
  label: z.string(),
  description: z.string().min(20, "최소 20자 이상 입력해주세요."),
  additionalPrice: z.number(),
  // 등록 가능 여부. false면 신규 상품에 새로 붙일 수 없을 뿐, 이미 그 기능을 쓰는
  // 상품과 고객 필터·과거 주문은 그대로다(docs 기준 결정).
  isActive: z.boolean(),
});

type PremiumFeatureDto = z.infer<typeof PremiumFeatureSchema>;

export { PremiumFeatureSchema, type PremiumFeatureDto };
