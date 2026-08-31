import { LegalDocumentTemplate } from "@/ui/components/molecules";
import { PRIVACY_SECTIONS, PRIVACY_EFFECTIVE_DATE } from "./_constants";

// 법무 미검수 초안 — 서비스 오픈 전 검토 필요. 보호책임자 연락처는 TODO(legal).
export default function PrivacyPage() {
  return (
    <LegalDocumentTemplate
      title="개인정보 처리방침"
      effectiveDate={PRIVACY_EFFECTIVE_DATE}
      sections={PRIVACY_SECTIONS}
    />
  );
}
