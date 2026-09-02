import { routes } from "@/core/domain/routes";
import { InvitationTemplate } from "../[publicKey]/_components";
import { SAMPLE_FEATURES, SAMPLE_THEME, sampleInvitation } from "./_constants";

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
