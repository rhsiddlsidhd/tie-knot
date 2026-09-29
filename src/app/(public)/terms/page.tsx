import { LegalDocument } from "@/ui/components/templates/LegalDocument";
import {
  TERMS_SECTIONS,
  TERMS_EFFECTIVE_DATE,
} from "./_constants/terms-sections";

// 법무 미검수 초안 — 서비스 오픈 전 검토 필요.
export default function TermsPage() {
  return (
    <LegalDocument
      title="이용약관"
      effectiveDate={TERMS_EFFECTIVE_DATE}
      sections={TERMS_SECTIONS}
    />
  );
}
