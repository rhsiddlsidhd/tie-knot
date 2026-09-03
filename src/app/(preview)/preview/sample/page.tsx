import { routes } from "@/core/domain/routes";
import { MobileInvitationTemplate } from "@/app/(preview)/preview/[publicKey]/_components/MobileInvitationTemplate";
import { SAMPLE_FEATURES, SAMPLE_THEME, sampleInvitation } from "@/app/(preview)/preview/sample/_constants/sampleInvitation";

export default function Page() {
  return (
    <MobileInvitationTemplate
      content={sampleInvitation}
      publicKey={routes.preview.samplePublicKey}
      features={[...SAMPLE_FEATURES]}
      theme={SAMPLE_THEME}
    />
  );
}
