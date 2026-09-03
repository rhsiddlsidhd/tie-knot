import { routes } from "@/core/domain/routes";
import { InvitationTemplate } from "@/app/(preview)/preview/[publicKey]/_components/InvitationTemplate";
import { SAMPLE_FEATURES, SAMPLE_THEME, sampleInvitation } from "@/app/(preview)/preview/sample/_constants/sampleInvitation";

export default function Page() {
  return (
    <InvitationTemplate
      content={sampleInvitation}
      publicKey={routes.preview.samplePublicKey}
      features={[...SAMPLE_FEATURES]}
      theme={SAMPLE_THEME}
    />
  );
}
